class Button {
  constructor(
    _id,
    _text,
    _x,
    _y,
    _width,
    _height,
    _fill,
    _stroke,
    _textColor,
    _font_size,
    _icon_id
  ) {
    this.id = _id;
    this.text = _text;
    this.width = _width;
    this.height = _height;
    this.x = _x + this.width / 2;
    this.y = _y + this.height / 2;
    this.round = 47;
    this.style = 1;
    this.textOffset = 13;

    this.fill = _fill;
    this.stroke = _stroke;
    this.textColor = _textColor;
    this.fontSize = _font_size;

    this.icon = _icon_id;

    this.lock = false;
    rectMode(CENTER);
  }

  display() {
    strokeWeight(3);
    //  Checks if mouse is over
    this.over();
  }

  //  Checks if the mouse is over the image
  over() {
    //  If mouse is over
    if (
      mouseX > this.x - this.width / 2 &&
      mouseX < this.x + this.width / 2 &&
      mouseY > this.y - this.height / 2 &&
      mouseY < this.y + this.height / 2
    ) {
      cursor(HAND); //  Cursor becomes a hand
      this.style1();
      return true;
    } else {
      cursor(ARROW);
      //  Else pause song and return FALSE
      this.style1();
      return false;
    }
  }

  style1() {
    if (this.fill == 0) noFill();
    else fill(this.fill);
    if (this.stroke == 0) noStroke();
    else stroke(this.stroke);
    rect(this.x, this.y, this.width, this.height, this.round);
    textFont(fontRegular);
    textSize(this.fontSize);
    noStroke();
    fill(this.textColor);
    push();
    imageMode(CENTER);
    if (this.icon == "no") text(this.text, this.x, this.y + this.textOffset);
    else image(icons[this.icon], this.x, this.y);
    pop();
  }

  style_hover() {
    stroke(palette.premium);
    fill(palette.premium);
    rect(this.x, this.y, this.width, this.height, this.round);
    textFont(fontRegular);
    textSize(36);
    noStroke();
    fill(palette.main);
    text(this.text, this.x, this.y + this.textOffset);
  }
  //  Run if mouse is pressed && over the image
  clicked() {
    if (this.over() && !this.lock) {
      if (this.id == 1) {
        warning = false;
        shop = true;
      } else if (this.id == 2) confermaOrdine();
      else if (this.id == 7) confermaCambio(rotolo_info);
      else if (this.id == 3) {
        warning = false;
        shop = false;
        info = false;
        resetCircles();
      } else if (this.id == 4) prevPage();
      else if (this.id == 5) nextPage();
      else if (this.id >= 100) {
        shop = false;
        info = true;
        rotolo_info = this.id - 100;
      } else if (this.id == 8) {
        info = false;
        shop = true;
        resetCircles();
      } else if (this.id == 9) shop = true;
      else if (this.id == 10) cambioRotolo();
    }
  }
}

function resetCircles() {
  circles.forEach((c) => {
    c.reset();
  });
  circlesMade = false;
}

let b_learn = [];
class TreeCard {
  constructor(id, text, _x, _y) {
    this.id = id;
    this.text = text;
    this.width = 360;
    this.height = 341;
    this.x = _x;
    this.y = _y;
    this.round = 33;
    this.textOffset = 10;
  }

  display() {
    push();
    noFill();
    strokeWeight(3);
    stroke(palette.white);
    rect(this.x, this.y, this.width, this.height, this.round);
    imageMode(CENTER);
    image(texture_rounded[this.id], this.x, this.y - 75, 100, 100);
    noStroke();
    textSize(36);
    textStyle(fontLight);
    fill(palette.white);
    text(trees[this.id].type, this.x, this.y + 25);

    b_learn[this.id] = new Button(
      100 + this.id,
      "Learn more >",
      this.x - 135,
      this.y + 70,
      270,
      71,
      palette.white,
      palette.white,
      palette.main,
      36,
      "no"
    );
    b_learn[this.id].lock = false;

    b_learn[this.id].display();
    // console.log("b_learn:", b_learn);
    pop();
  }
}

class CircleInfo {
  constructor(_name, _value, _x, _y) {
    this.name = _name;
    this.value = _value;
    this.max_angle = (360 / 5) * this.value;
    this.x = _x;
    this.y = _y;
    this.angle = 0;
    this.increment = 3;
  }

  display() {
    push();
    translate(50, 50);
    push();
    translate(this.x, this.y);
    push();
    angleMode(DEGREES);
    rectMode(CENTER);

    rotate(-90);
    fill(125);
    circle(0, 0, 110);
    fill(palette.white);
    if (this.angle < this.max_angle) this.angle += this.increment;
    arc(0, 0, 110, 110, 0, this.angle);
    fill(palette.main);
    circle(0, 0, 60);
    pop();
    fill(palette.white);
    textSize(48);
    text(this.value, 0, 15);
    textSize(36);
    text(this.name.charAt(0).toUpperCase() + this.name.slice(1), 0, 100);
    pop();
    pop();
  }

  reset() {
    this.angle = 0;
  }
}
