//  Socket Library
const socket = io();

//  Array per info su Alberi
let trees = [];

//  Parametri del rotolo
const maxRoll_L = 23000;
const maxRoll_D = 120;
const minRoll_D = 45;
const lung_strappo = 115;
const perc_threshold = 30;
const max_turnings = 88.7394;
const thickness = 0.4226;
const N = 40;
const turn_increment = 1 / N;

let roll_in_uso = 1;
let roll_direzione = "front";
let roll_index = roll_in_uso - 1;
let next_roll = 2;
let oldRoll = {};

let roll_lung = 1200;
let roll_perc = 100;
let roll_D = 120;
//  Variabili per determinare strappi
let contatore = 0;
let turnings = 0;
let dist = 0;
let preDist;
let temp_dist = 0;
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
const palette = {
  main: "#023A2F",
  white: "#FFFBF3",
  base: "#939960",
  regular: "#E5B76E",
  premium: "#ED824C",
};

const margin_top = -225;
const btn_top = 25;
const btn_right = 1090;
const raggio = 500;
const btn_size = 200;

const sizes = {
  big: 60,
  medium: 48,
  small: 38,
};

//  Animazione
let start_frame = 0;
let end_frame = 49;
let didPlay = false;
let ship_play = false;
let anim_1, anim_4;
let div_strappo;
let div_empty;
let div_card;
let div_ship;
let anim_roll;
let anim_empty;
let anim_card;
let anim_ship;

const interval_time = 2000;
let init_time = 0;

let prev_contatore = 0;
//  Quando l'encoder viene ruotato il client riceve il numero di incrementi
socket.on("distChange", (message) => {
  contatore = message;
  console.log("contatore:", contatore);

  // console.log({ contatore, circonferenza_ist, incremento, temp_dist });
  //  Evito che il valore si azzeri improvvisamente quando il sensore sbaglia
  if (!pagamentoInviato && preDist > temp_dist && contatore < prev_contatore)
    console.log("DISTANZA NON VALIDA");
  else {
    // let temp_dist;
    const circonferenza_ist = Math.PI * roll_D;
    console.log("roll_D:", roll_D);
    console.log(circonferenza_ist);
    const incremento = circonferenza_ist / N;
    console.log("incremento:", incremento);
    // temp_dist = ((Math.PI * roll_D) / N) * contatore;
    temp_dist += incremento;
    // temp_dist = ((Math.PI * roll_D) / (2 * N)) * contatore;
    //  ! Smette di incrementare dopo ogni strappo
    //TODO  Da mettere nel DB
    turnings += turn_increment;
    updateTurnings(turnings);
    console.log("turnings:", turnings);
    dist = temp_dist;
    console.log("dist:", dist);

    prev_contatore = contatore;
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
      //  Aggiorno dati sul DB
      updateStrappi(roll_index, square_rounded, prezzo);
      //  Azzero dati su arduino
      console.log("AZZERO");
      //  Azzero tutte le variabili
      azzeraVariabili();
      pagamentoInviato = true;
      // if (ordineRichiesto) ordineRichiesto = false;
    }
    //  Se c'è la CC
  } else if (message == 1) {
    //  Aggiorno direzione in accensione
    if (roll_direzione == "front") socket.emit("direzioneFront");
    else if (roll_direzione == "back") socket.emit("direzioneBack");
    standby = false; // Esci dallo Stanby
    pagamentoInviato = false; // Il pagamento non è ancora stato inviato
  }
});

function azzeraVariabili() {
  contatore = 0;
  prev_contatore = 0;
  temp_dist = 0;
  dist = 0;
  preDist = 0;
  square = 0;
  square_rounded = 0;
  prev_square_rounded = 0;
}

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
  anim_card = loadJSON("./00_assets/04_animations/card.json");
  anim_ship = loadJSON("./00_assets/04_animations/ship.json");
}

//  PNG textures circolari
function loadTextures(_nTrees) {
  _nTrees.forEach((t, index) => {
    images[index] = loadImage(
      "./00_Assets/01_img/texture_bg/" + img_url_base + t.id + ".svg"
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

  //  Definizione variabili
  preDist = dist;
  trees = data.trees;
  offX = width / 2;
  offY = height / 2;
  bx = new Button(
    3,
    "X",
    btn_right,
    btn_top,
    btn_size,
    btn_size,
    0,
    0,
    palette.white,
    sizes.big,
    0
  );

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
  div_empty.position(320, 40);
  div_empty.hide();

  //  Animazione Card
  div_card = createDiv();
  div_card.class("center");
  div_card.style("margin-left", "auto");
  div_card.style("display", "block");
  div_card.style("width", "43vw");
  params = {
    container: div_card.elt,
    loop: true,
    autoplay: true,
    animationData: anim_card,
    renderer: "svg",
  };
  anim_3 = bodymovin.loadAnimation(params);
  div_card.position(380, 160);
  div_card.hide();

  //  Animazione Shipping
  div_ship = createDiv();
  div_ship.class("center");
  div_ship.style("margin-left", "auto");
  div_ship.style("display", "block");
  div_ship.style("width", "43vw");
  params = {
    container: div_ship.elt,
    loop: false,
    autoplay: false,
    animationData: anim_ship,
    renderer: "svg",
  };
  anim_4 = bodymovin.loadAnimation(params);
  div_ship.position(380, 210);
  div_ship.hide();
}

//  Esegue animazione
function animate() {
  let targetFrames = [0, 0];
  if (!didPlay) didPlay = true;
  targetFrames = [start_frame, end_frame];
  anim_1.playSegments([targetFrames], true);
}

function animate_ship() {
  let targetFrames = [0, 0];
  if (!ship_play) ship_play = true;
  targetFrames = [0, 60];
  anim_4.playSegments([targetFrames], true);
}

function draw() {
  background(palette.main); //BG

  if (allUsers) {
    //  Quando carico dati dell'utente da DB
    roll_lung = allUsers.rotolo_in_uso.lunghezza;
    roll_in_uso = allUsers.rotolo_in_uso.id;
    roll_index = roll_in_uso - 1;
    roll_direzione = allUsers.rotolo_in_uso.direzione;
    next_roll = allUsers.dati_generici.next_roll;
    turnings = allUsers.rotolo_in_uso.turnings;
    //  ? Cambio direzione in Arduino anche qua? TEST!!
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

//  Pagamento
function drawPay() {
  //  Determino Diametro e % in base a lunghezza attuale del rotolo
  // roll_D = map(roll_lung, maxRoll_L, 0, maxRoll_D, minRoll_D);
  roll_D = (thickness / PI) * ((max_turnings - turnings) * TWO_PI) + minRoll_D;
  roll_perc = map(roll_lung, maxRoll_L, 0, 100, 0);

  //  Se lunghezza maggiore di 0 (c'è il rotolo)
  if (roll_lung >= 0) {
    image(images[roll_index], 0, 0, 1280, 720); //  Texture BG
    deltaDist = dist - preDist; //  Determino Delta tra distanze
    //  Se deltaDist != 0 --> Tolgo delta a lunghezza del rotolo
    //  Con deltaDist > 0 evito che alla fine tutta la differenza si sommi di nuovo al totale (grazie Michele :))
    if (dist != preDist && deltaDist > 0) {
      roll_lung -= deltaDist;
      updateLunghezza(roll_lung); //  Aggiorno DB
      console.log("roll_D:", roll_D);
      console.log("roll_lung:", roll_lung);
      console.log("roll_perc:", roll_perc + "%");
    }
    preDist = dist;
    //  Info da mostrare in base a rotolo montato
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
    circle(1280, 0, raggio);
    translate(offX, offY);
    rectMode(CENTER);
    // translate(width / 2, 100);
    textFont(fontLight);
    textSize(sizes.big);
    text(trees[roll_in_uso - 1].type.toUpperCase(), 0, margin_top);

    //  Dati su strappi e prezzo

    textFont(fontRegular);
    fill(palette.white);
    textSize(160);
    text(round(prezzo, 2) + " €", 0, 0);
    textSize(110);
    textAlign(RIGHT);
    text(square_rounded, -50, spacing);
    pop();

    b_shop = new Button(
      9,
      "S",
      btn_right,
      btn_top,
      btn_size,
      btn_size,
      0,
      0,
      palette.white,
      sizes.big,
      4
    );
    b_shop.display();

    //  Se la percentuale del rotolo va sotto una determinata soglia --> Avviso di rinnovo
    if (roll_perc < perc_threshold && !ordineRichiesto) {
      console.log("RICHIEDI ORDINE");
      warning = true;
      ordineRichiesto = true;
    } else if (roll_lung <= 0) {
      empty = true;
    }
  }
  div_card.hide();
  div_strappo.show(); //  Mostro TP Icon animata
}

//  Standby
function drawStandby() {
  //  Testo
  push();
  translate(offX, offY);
  fill(palette.white);
  // translate(0, -100);
  textFont(fontRegular);
  textSize(sizes.medium);
  text("Insert your credit card", 0, margin_top);
  pop();
  div_strappo.hide(); //  Nascondo animazione
  div_card.show();
}

//  Warning
function drawWarning() {
  //  Testi
  push();
  translate(offX, offY);
  push();
  fill(palette.white);
  // translate(0, -100);
  textFont(fontRegular);
  textSize(sizes.medium);
  text("Your roll is about to end", 0, margin_top);
  textSize(sizes.small);
  text("Less than " + 25 + "% remaning", 0, -150, 540);
  textFont(fontLight);
  text(
    "Your Treem subscription for " +
      allTrees[roll_in_uso].type +
      " will automatically renew until you change tree.",
    0,
    -80,
    717
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
    "Keep the same",
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
  div_card.hide();
}

//  Ringrazimento
function drawGrazie() {
  console.log("Grazie");
  push();
  translate(width / 2, height / 2);
  textSize(70);
  fill(palette.white);
  text(
    `Thanks! 
  Your next roll is on its way`,
    0,
    margin_top
  );
  pop();

  //  Durata limitata
  if (millis() - init_time >= interval_time) {
    grazie = false;
    div_ship.hide();
  }
}

function confermaOrdine() {
  console.log("Albero confermato! --> Vai a Grazie");
  ordineRichiesto = true;
  warning = false;
  info = false;
  grazie = true;
  div_ship.show();
  animate_ship();
  init_time = millis();
}

function confermaCambio(id) {
  console.log("Aggiorno Next Roll");
  if (id != next_roll) {
    next_roll = id;
    console.log("next_roll:", next_roll);
    updateNextRoll(next_roll);
  }
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
  translate(offX, offY);
  fill(palette.white);
  textFont(fontRegular);
  textSize(sizes.medium);
  text("Choose your next roll", 0, margin_top);
  push();
  textAlign(CENTER);
  translate(0, 260);
  text(costo_strappo + " €", 0, 0);
  textSize(sizes.small);
  fill(fillColor);
  textFont(fontLight);
  text(classe.charAt(0).toUpperCase() + classe.slice(1), 0, 50);
  pop();
  pop();

  bl = new Button(
    4,
    "<",
    -250 + offX,
    510,
    btn_size,
    btn_size,
    0,
    0,
    palette.white,
    sizes.big,
    2
  );
  bl.display();
  br = new Button(
    5,
    ">",
    50 + offX,
    510,
    btn_size,
    btn_size,
    0,
    0,
    palette.white,
    sizes.big,
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
      cards[i] = new TreeCard(treeIndex, t.type, 260 + 380 * i, offY + 5);
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
  const shitf_vert = 40;
  const properties = [
    { name: "softness", x: 190, y: 202 + shitf_vert },
    { name: "resistence", x: 452, y: 202 + shitf_vert },
    { name: "thickness", x: 190, y: 433 + shitf_vert },
    { name: "absorbency", x: 452, y: 433 + shitf_vert },
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
  translate(offX, offY);
  textFont(fontRegular);
  textSize(sizes.big);
  text(trees[id].type.toUpperCase(), 0, margin_top);
  textFont(fontLight);
  textSize(sizes.small);
  text(trees[id].provenienza, 0, margin_top + 50);
  pop();
  push();
  translate(1000, 260);
  textFont(fontLight);
  textSize(sizes.small);
  text(
    trees[id].class.charAt(0).toUpperCase() + trees[id].class.slice(1),
    0,
    0
  );
  textFont(fontRegular);
  textSize(64);
  fill(palette.white);
  text(costo_strappo + " €", 0, 80);
  textFont(fontLight);
  textSize(sizes.small);
  fill(palette.white);
  text("per sheet", 0, 130);
  pop();

  b_sub = new Button(
    7,
    "Subscribe",
    1000 - 330 / 2,
    520,
    330,
    95,
    fillColor,
    fillColor,
    palette.main,
    sizes.medium,
    "no"
  );
  b_sub.display();
  //  Bottone per tornare indietro
  b_arrow = new Button(
    8,
    "Arrow",
    btn_top - 20,
    btn_top,
    btn_size,
    btn_size,
    0,
    0,
    palette.white,
    sizes.big,
    1
  );
  b_arrow.display();

  bx.display();
}

function drawEmpty() {
  //  Testi
  push();
  translate(offX, offY);
  push();
  fill(palette.white);
  // translate(0, -100);
  textFont(fontRegular);
  textSize(sizes.medium);
  text("You are out of paper", 0, margin_top);
  textFont(fontLight);
  textSize(sizes.small);
  text("Change the roll before continuing", 0, margin_top + 55, 640);

  pop();
  pop();

  //  Creo Bottoni
  b_done = new Button(
    10,
    "Done",
    offX - btn_width / 2,
    550,
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
    lunghezza: maxRoll_L,
    n_strappi: 0,
    turnings: 0,
    direzione: direzione_scelta,
    from: today,
  };
  console.log("Aggiorno Info DB");

  updateStrappi(roll_index, square_rounded, prezzo);
  addUsedRoll(oldRoll);
  updateRotolo(newRoll);

  azzeraVariabili();
  cambiaDirezioneArduino(direzione_scelta);
  if (ordineRichiesto) ordineRichiesto = false;

  scegliLato = false;
}

function cambiaDirezioneArduino(direzione) {
  //  Cambio direzione Arduino
  if (direzione == "front") socket.emit("direzioneFront");
  else if (direzione == "back") socket.emit("direzioneBack");
  else console.warn("Direzione Errata");
}

function drawScegliLato() {
  //  Testi
  push();
  translate(offX, offY);
  push();
  fill(palette.white);
  // translate(0, -100);
  textFont(fontRegular);
  textSize(sizes.medium);
  text("Which side are you on?", 0, margin_top);
  textFont(fontLight);
  textSize(sizes.small);
  text("Chose the way in which you mounted your roll", 0, margin_top + 55, 480);
  pop();
  pop();

  //  Creo Bottoni
  b_front = new Button(
    11,
    "Over",
    offX - 350,
    offY - 40,
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
    "Under",
    offX + 150,
    offY - 40,
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
  textSize(sizes.medium);
  text("Over", b_front.x, b_front.y + 175);
  text("Under", b_back.x, b_back.y + 175);
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
}

//  Key actions
function keyPressed() {
  let d = day();
  let m = month();
  let y = year();

  //  Save canvas as a png with date
  if (key == "s" || key == "S") saveCanvas(y + "_" + m + "_" + d + "png");
}
