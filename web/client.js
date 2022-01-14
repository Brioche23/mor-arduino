//  Socket Library
const socket = io();

//  Array per info su Alberi
let trees = [];

//  Parametri del rotolo
const N = 20;
const maxRoll_L = 1200;
const maxRoll_D = 12;
const minRoll_D = 4.5;
const lung_strappo = 11;
const perc_threshold = 30;
const max_turnings = 88.7394;
const thickness = 0.4226;
const turn_increment = 1 / 20;

let roll_in_uso = 1;
let roll_index = roll_in_uso - 1;
let next_roll = 2;
let oldRoll = {};

let roll_lung;
let roll_perc;
let roll_D;
//  Variabili per determinare strappi
let contatore = 0;
let turnings = 0;
let dist = 0;
let preDist;
let deltaDist;
let square;
let square_rounded;
let prev_square_rounded = 0;
let prezzo;

//  Assets
let img_url_base = "texture_";
let images = [];
let texture_rounded = [];
let icons = [];
let index = 0;
let data;
let fontLight;
let fontRegular;
let fontMedium;
let offX;
let offY;

let btn_width = 360;
let btn_height = 95;

//  Sentinelle per schermate
let standby = false;
let warning = false;
let grazie = false;
let shop = false;
let info = false;
let empty = false;
let scegliLato = false;
let rotolo_info;
let pagamentoInviato = true;
let ordineRichiesto = false;
let treesLoaded = false;

// Palette colori
let palette = {
  main: "#023A2F",
  white: "#FFFBF3",
  base: "#939960",
  regular: "#E5B76E",
  premium: "#ED824C",
};

//  Animazione
let start_frame = 0;
let end_frame = 49;
let didPlay = false;
let anim_1;
let anim_2;
let div_strappo;
let div_empty;
let anim_roll;
let anim_empty;

//  Quando l'encoder viene ruotato il client riceve il numero di incrementi
socket.on("distChange", (message) => {
  console.log("COUNTER:", message);
  contatore = message;
  let temp_dist;
  //  Divido per 2 perchè la distanza mi risulta il doppio di quella effettiva
  temp_dist = ((Math.PI * roll_D) / (2 * N)) * contatore;

  //  Evito che il valore si azzeri improvvisamente quando il sensore sbaglia
  if (!pagamentoInviato && preDist > temp_dist)
    console.log("DISTANZA NON VALIDA");
  else {
    //  Da mettere nel DB
    turnings += turn_increment;
    console.log("turnings:", turnings);
    dist = temp_dist;
    console.log("dist:", dist);
  }
});

//  Check cambio di stato dello switch (Carta di credito)
socket.on("btnChange", (message) => {
  console.log("BTN:", message);
  //  Se non c'è la carta
  if (message == 0) {
    standby = true; // Standby
    //  Se il pagamento non è stato inviato --> Invio Dati
    if (!pagamentoInviato) {
      console.log("Invio dati");
      //  Aggiorno dati sul server
      updateStrappi(roll_index, square_rounded, prezzo);
      //  Azzero dati su arduino
      socket.emit("azzeraCounter");
      console.log("AZZERO");
      //  Azzero tutte le variabili
      contatore = 0;
      square = 0;
      square_rounded = 0;
      prev_square_rounded = 0;
      pagamentoInviato = true;
      // if (ordineRichiesto) ordineRichiesto = false;
    }
    //  Se c'è la CC
  } else if (message == 1) {
    standby = false; // Esci dallo Stanby
    pagamentoInviato = false; // Il pagamento non è ancora stato inviato
  }
});

//  Caricamento Assets
function preload() {
  //  JSON con 9 alberi
  data = loadJSON("./00_assets/02_json/alberi.json", (data) => {
    loadTextures(data.trees);
  });
  //  Font Rubik
  fontLight = loadFont("./00_assets/03_fonts/Rubik-Light.ttf");
  fontRegular = loadFont("./00_assets/03_fonts/Rubik-Regular.ttf");
  fontMedium = loadFont("./00_assets/03_fonts/Rubik-Medium.ttf");

  //  SVG delle icone
  for (let i = 0; i < 7; i++)
    icons[i] = loadImage("./00_assets/01_img/icons/" + i + ".svg");

  //  JSON dell'animazione: Icona TP
  anim_roll = loadJSON("./00_assets/04_animations/tp_icon.json");
  anim_empty = loadJSON("./00_assets/04_animations/empty.json");
}

//  PNG textures circolari
function loadTextures(_nTrees) {
  _nTrees.forEach((t, index) => {
    images[index] = loadImage(
      "./00_Assets/01_img/" + img_url_base + t.id + ".svg"
    );
    texture_rounded[index] = loadImage(
      "./00_Assets/01_img/texture_round/PNG/" + t.id + ".png"
    );
  });
}
let bx;
let b_shop;
//  Setup
function setup() {
  createCanvas(1280, 720); //  Canvas fisso
  // background(palette.main); //  BG

  textFont(fontRegular); //  Peso di base?
  textAlign(CENTER);
  imageMode(CORNER);
  rectMode(CENTER);

  //  Devinizione variabili
  preDist = dist;
  trees = data.trees;
  offX = width / 2;
  offY = height / 2;
  bx = new Button(3, "X", 1180, 55, 50, 50, 0, 0, palette.white, 60, 0);

  //  Animazione Rotolo Strappato
  div_strappo = createDiv();
  let params = {
    container: div_strappo.elt,
    loop: false,
    autoplay: false,
    animationData: anim_roll,
    renderer: "svg",
  };
  anim_1 = bodymovin.loadAnimation(params);
  // div_strappo.mousePressed(animate);
  div_strappo.position(550, 420);
  div_strappo.hide();

  //  Animazione Rotolo Vuoto
  div_empty = createDiv();
  div_empty.class("center");
  div_empty.style("margin-left", "auto");
  div_empty.style("display", "block");
  div_empty.style("width", "50vw");
  params = {
    container: div_empty.elt,
    loop: true,
    autoplay: true,
    animationData: anim_empty,
    renderer: "svg",
  };
  anim_2 = bodymovin.loadAnimation(params);
  div_empty.position(320, 0);
  div_empty.hide();

  // const D = 12;
  // const d = 4.5;
  // const sL = 11.5;
  // const maxL = 2300;
  // const thickness = 0.0422;
  // const minL = 0;
  // let L = 1150;

  // console.log("Desired: 9.0625 - Diametro:", diametro);
}

//  Esegue animazione
function animate() {
  let targetFrames = [0, 0];
  if (!didPlay) didPlay = true;
  targetFrames = [start_frame, end_frame];
  anim_1.playSegments([targetFrames], true);
}

function draw() {
  background(palette.main); //BG
  if (allUsers) {
    //  Quando carico dati dell'utente da DB
    roll_lung = allUsers.rotolo_in_uso.lunghezza;
    roll_in_uso = allUsers.rotolo_in_uso.id;
    roll_index = roll_in_uso - 1;
    //  Cambio schermate in base a sentinelle
    if (standby) drawStandby();
    else if (warning) drawWarning();
    else if (grazie) drawGrazie();
    else if (shop) drawShop();
    else if (info) drawInfo(rotolo_info);
    else if (empty) drawEmpty();
    else if (scegliLato) drawScegliLato();
    else drawPay();
  }
}

let raggio = 376;
//  Pagamento
function drawPay() {
  //  Determino Diametro e % in base a lunghezza attuale del rotolo
  // roll_D = map(roll_lung, maxRoll_L, 0, maxRoll_D, minRoll_D);
  roll_D = (thickness / PI) * ((max_turnings - turnings) * TWO_PI);
  roll_perc = map(roll_lung, maxRoll_L, 0, 100, 0);

  //  Se lunghezza maggiore di 0 (c'è il rotolo)
  if (roll_lung >= 0) {
    console.log("drawPay");
    image(images[roll_index], 0, 0, 1280, 720); //  Texture BG
    deltaDist = dist - preDist; //  Determino Delta tra distanze
    //  Se deltaDist != 0 --> Tolgo delta a lunghezza del rotolo
    //  Con deltaDist > 0 evito che alla fine tutta la differenza si sommi di nuovo al totale (grazie Michele :))
    if (dist != preDist && deltaDist > 0) {
      roll_lung -= deltaDist;
      updateLunghezza(roll_lung); //  Aggiorno DB
      console.log("roll_lung:", roll_lung);
      console.log("roll_perc:", roll_perc + "%");
    }
    preDist = dist;
    //  Info da mostrare in base a rotolo montato (da ottimizzare)
    let costo_strappo;
    let fillColor;
    switch (trees[roll_index].class) {
      case "base":
        costo_strappo = 0.04;
        fillColor = palette.base;
        break;
      case "regular":
        costo_strappo = 0.08;
        fillColor = palette.regular;
        break;
      case "premium":
        costo_strappo = 0.12;
        fillColor = palette.premium;
        break;
    }
    square = dist / lung_strappo; //  Determino strappo prelevato
    square_rounded = floor(square); //  Arrotondo senza decimali
    prezzo = square * costo_strappo; //  Determino prezzo

    //  Se lo strappo incrementa --> Parte animazione
    if (square_rounded > prev_square_rounded) {
      animate();
      prev_square_rounded = square_rounded;
    }

    //  Parte testuale
    fill(fillColor);
    let spacing = 180;
    //  Tipo di Albero in uso
    push();
    rectMode(CENTER);
    circle(1280, 0, raggio);
    translate(width / 2, 100);
    textFont(fontLight);
    textSize(60);
    text(trees[roll_in_uso - 1].type.toUpperCase(), 0, 0);
    pop();
    //  Dati su strappi e prezzo
    push();
    translate(width / 2, height / 2);
    textFont(fontRegular);
    fill(palette.white);
    textSize(160);
    text(round(prezzo, 2) + " €", 0, 0);
    textSize(110);
    textAlign(RIGHT);
    text(square_rounded, -50, spacing);
    pop();

    b_shop = new Button(9, "S", 1180, 55, 50, 50, 0, 0, palette.white, 60, 4);
    b_shop.display();

    //  Se la percentuale del rotolo va sotto una determinata soglia --> Avviso di rinnovo
    if (roll_perc < perc_threshold && !ordineRichiesto) {
      console.log("RICHIEDI ORDINE");
      // alert("RICHIEDI ORDINE");
      warning = true;
      ordineRichiesto = true;
    } else if (roll_lung == 0) empty = true;
  }
  div_strappo.show(); //  Mostro TP Icon animata
}

//  Standby
function drawStandby() {
  //  Testo
  push();
  translate(width / 2, height / 2);
  textSize(70);
  fill(palette.white);
  text("Insert your credit card", 0, 0);
  pop();
  div_strappo.hide(); //  Nascondo animazione
}

//  Warning
function drawWarning() {
  //  Testi
  push();
  translate(offX, offY);
  push();
  fill(palette.white);
  translate(0, -100);
  textFont(fontRegular);
  textSize(48);
  text("Your roll is about to end", 0, -150);
  textFont(fontRegular);
  textSize(38);
  text("Less than " + 25 + "% remaning", 0, -100, 640);
  textFont(fontLight);
  text(
    "Your Treem subscription for Maple will automatically renew until you change tree.",
    0,
    -30,
    817
  );
  pop();
  pop();

  b1 = new Button(
    1,
    "Change tree",
    210,
    503,
    btn_width,
    btn_height,
    palette.main,
    palette.white,
    palette.white,
    36,
    "no"
  );
  b1.display();

  b2 = new Button(
    2,
    "Keep Maple",
    667,
    503,
    btn_width,
    btn_height,
    palette.white,
    palette.white,
    palette.main,
    36,
    "no"
  );
  b2.display();

  bx.display();
  div_strappo.hide();
}

//  Ringrazimento
function drawGrazie() {
  console.log("Grazie");
  push();
  translate(width / 2, height / 2);
  textSize(70);
  fill(palette.white);
  text("Thanks! Your next roll is on its way", 0, 0);
  pop();
  //  Durata limitata
  setInterval(() => {
    grazie = false;
  }, 2000);
}

function confermaOrdine() {
  console.log("Albero confermato! --> Vai a Grazie");
  ordineRichiesto = true;
  warning = false;
  info = false;
  grazie = true;
}

function confermaCambio(id) {
  console.log("Aggiorno Next Roll");
  next_roll = id;
  console.log("next_roll:", next_roll);
  confermaOrdine();
}

//  Shop
let page = 1;
let index_offset;
let fillColor;
let costo_strappo;
let classe;
function drawShop() {
  switch (page) {
    case 1:
      classe = "base";
      costo_strappo = 0.04;
      fillColor = palette.base;
      index_offset = 0;
      break;
    case 2:
      classe = "regular";
      costo_strappo = 0.08;
      fillColor = palette.regular;
      index_offset = 3;
      break;
    case 3:
      classe = "premium";
      costo_strappo = 0.12;
      fillColor = palette.premium;
      index_offset = 6;
      break;
  }
  //  Testi
  push();
  translate(offX, 0);
  fill(palette.white);
  textFont(fontRegular);
  textSize(48);
  text("Choose your next roll", 0, 100);
  push();
  translate(0, 515);
  text(costo_strappo + "€", 0, 100);
  textSize(36);
  fill(fillColor);
  text(classe.charAt(0).toUpperCase() + classe.slice(1), 0, 150);
  pop();
  pop();

  bl = new Button(
    4,
    "<",
    -200 + offX,
    575,
    100,
    100,
    0,
    0,
    palette.white,
    60,
    2
  );
  bl.display();
  br = new Button(
    5,
    ">",
    100 + offX,
    575,
    100,
    100,
    0,
    0,
    palette.white,
    60,
    3
  );
  br.display();
  bx.display();

  //  Creo card per gli alberi nella pagina
  let cards = [];
  let i = 0;
  trees.forEach((t) => {
    if (t.class == classe) {
      let treeIndex = i + index_offset;
      cards[i] = new TreeCard(treeIndex, t.type, 260 + 380 * i, height / 2);
      cards[i].display();
      i++;
    }
  });
  div_strappo.hide();
}

//  Next Page
function nextPage() {
  console.log("Next page");
  if (page <= 3) page++;
  console.log("page:", page);
  if (page == 4) page = 1;
  lockBtns();
}

//  Prev Page
function prevPage() {
  console.log("Prev page");
  if (page > 0) page--;
  if (page == 0) page = 3;
  lockBtns();
}

//  Blocco i bottoni di Learn che non sono nella pagina
function lockBtns() {
  b_learn.forEach((b) => {
    b.lock = true;
  });
}

//  Info su determinato Rotolo
let circlesMade = false;
let circles = [];
function drawInfo(id) {
  //  Oggetto oer le proprietà e la posizione dei cerchi
  let properties = [
    { name: "softness", x: 190, y: 202 },
    { name: "resistence", x: 452, y: 202 },
    { name: "thickness", x: 190, y: 433 },
    { name: "absorbency", x: 452, y: 433 },
  ];
  //  Se i cerchi non sono ancora stati costruiti
  if (!circlesMade) {
    //  Creo un cerchio per ogni proprietà
    properties.forEach((p, index) => {
      let prop = p.name;
      circles[index] = new CircleInfo(prop, trees[id][prop], p.x, p.y);
    });
    circlesMade = true;
  }
  //  Per ogni cerchio --> Display
  circles.forEach((c) => {
    c.display();
  });

  //  Testo e Bottone
  fill(palette[trees[id].class]);
  push();
  translate(width / 2, 100);
  textFont(fontLight);
  textSize(60);
  text(trees[id].type.toUpperCase(), 0, 0);
  pop();
  push();
  translate(1000, 210);
  textFont(fontLight);
  textSize(36);
  text(
    trees[id].class.charAt(0).toUpperCase() + trees[id].class.slice(1),
    0,
    0
  );
  textFont(fontRegular);
  textSize(64);
  fill(palette.white);
  text(costo_strappo + " €", 0, 80);
  textFont(fontRegular);
  textSize(36);
  fill(palette.white);
  text("per sheet", 0, 120);
  pop();

  b_sub = new Button(
    7,
    "Subscribe",
    1000 - 330 / 2,
    500,
    330,
    95,
    fillColor,
    fillColor,
    palette.main,
    48,
    "no"
  );
  b_sub.display();
  //  Bottone per tornare indietro
  b_arrow = new Button(8, "Arrow", 50, 55, 50, 50, 0, 0, palette.white, 60, 1);
  b_arrow.display();

  bx.display();
}

function drawEmpty() {
  //  Testi
  push();
  translate(offX, offY);
  push();
  fill(palette.white);
  translate(0, -100);
  textFont(fontRegular);
  textSize(48);
  text("You are out of paper", 0, -150);
  textFont(fontLight);
  textSize(38);
  text("Change the roll before continuing", 0, -100, 640);

  pop();
  pop();

  //  Creo Bottoni

  b_done = new Button(
    10,
    "Done",
    offX - btn_width / 2,
    503,
    btn_width,
    btn_height,
    palette.white,
    palette.white,
    palette.main,
    36,
    "no"
  );
  b_done.display();

  div_strappo.hide();
  div_empty.show();
}

function cambioRotolo(direzione_scelta) {
  const d = day();
  const m = month();
  const y = year();

  let oldFrom = allUsers.rotolo_in_uso.from;
  let today = d + "/" + m + "/" + y;
  console.log("Carico nuovo rotolo");
  let oldRoll = {
    id: roll_in_uso,
    from: oldFrom,
    to: today,
  };
  roll_in_uso = next_roll;
  roll_index = roll_in_uso - 1;

  let newRoll = {
    id: roll_in_uso,
    lunghezza: 1200,
    n_strappi: 0,
    turnings: 0,
    direzione: direzione_scelta,
    from: today,
  };
  console.log("Aggiorno Info DB");
  addUsedRoll(oldRoll);
  updateRotolo(newRoll);
  //  Cambio direzione Arduino
}

function drawScegliLato() {
  //  Testi
  push();
  translate(offX, offY);
  push();
  fill(palette.white);
  translate(0, -100);
  textFont(fontRegular);
  textSize(48);
  text("Which side are you on?", 0, -150);
  textFont(fontLight);
  textSize(38);
  text("Chose the way in which you mounted your roll", 0, -100, 480);
  pop();
  pop();

  //  Creo Bottoni

  b_front = new Button(
    11,
    "Front",
    offX - 350,
    offY - 65,
    200,
    200,
    0,
    0,
    palette.main,
    36,
    5
  );

  b_front.display();

  b_back = new Button(
    12,
    "back",
    offX + 150,
    offY - 65,
    200,
    200,
    0,
    0,
    palette.main,
    36,
    6
  );
  b_back.display();

  push();
  fill(palette.white);
  textSize(48);
  text("Front", b_front.x, b_front.y + 175);
  text("Back", b_back.x, b_back.y + 175);
  pop();
}

//  Determinati btns divenatno cliccabili in determinate pagine
function mouseClicked() {
  // index++;
  if (warning) {
    b1.clicked();
    b2.clicked();
  } else if (shop) {
    bl.clicked();
    br.clicked();
    b_learn.forEach((b) => {
      b.clicked();
    });
  } else if (info) {
    b_sub.clicked();
    b_arrow.clicked();
  } else if (empty) {
    b_done.clicked();
  } else if (scegliLato) {
    b_front.clicked();
    b_back.clicked();
  }

  if (warning || shop || info) bx.clicked();
  else if (!standby && !grazie && !empty && !scegliLato) {
    console.log("Apri Shop");
    b_shop.clicked();
  }
  // console.log("warning:", warning);
  // console.log("shop:", shop);
  // console.log("info:", info);
  // console.log("standby:", standby);
  // console.log("grazie:", grazie);
}
