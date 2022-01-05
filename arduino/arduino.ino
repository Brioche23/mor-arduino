#include <Servo.h>

Servo myServo;

//Definizione pin
const unsigned int pinClk = 4;
const unsigned int pinDt = 3;
int const pinBtn = 12;
int const pinServo = 11;

//  Variabili per il servo
boolean btnState;
boolean prevBtn = LOW;
int angle;

// Conserva stato ultima posizione encoder
int prevClk;
int prevDt;

//  var per mantenere il valore del contatore di esempio
int contatore;

const float pi = 3.141592;

const float D = 11.5;

const float R = D / 2;

const int N = 20;

float distance = 0;

// crea in memoria un posto dove salvare i messaggi che ci arrivano dalla porta seriale
String inputString = "";
// tieni traccia di quando il messaggio che arrriva dalla porta seriale è completo
// un messaggio è completo quando arriva il carattere 'a capo' (\n)
boolean stringComplete = false;

void setup() {
  Serial.begin(250000);

  pinMode(pinClk, INPUT);
  pinMode(pinDt, INPUT);

  myServo.attach(pinServo);
  myServo.write(0);

  //  Prima lettura di valori su pin

  prevClk = digitalRead(pinClk);
  prevDt = digitalRead(pinDt);

  //  Inizializzo var contatore
  contatore = 0;


}

void loop() {
  btnPressed();
  checkEncoder();
  
  checkIncomingData();
  azzeraCounter();

}

void checkEncoder () {
  // Leggi valori dai pin dell'encoder
  int currClk = digitalRead(pinClk);
  int currDt = digitalRead(pinDt);

  // Se la lettura corrente è diversa dall'ultima memorizzata

  if (btnState == 1) {

    if (currClk != prevClk) {

      //  Se il valore di dt == clk

      if (currDt == currClk) {
        contatore++;
        //  Mostra stato di contatore
        distance = ((2 * pi * R) / N) * contatore;

        Serial.print("Contatore: ");
        Serial.println(contatore);
      }
    } else {
      //contatore++;
      delay(5);
    }
    //  Aggiorna Valori
    prevClk = currClk;
    prevDt = currDt;
  }
}


void btnPressed() {
  btnState = digitalRead(pinBtn);
  if (btnState != prevBtn) {
    Serial.print("Btn: ");
    Serial.println(btnState);

    if (btnState) angle = 90;
    else angle = 0;

    myServo.write(angle);
    delay(5);
  }
  prevBtn = btnState;
}


// ascolta se arriva qualche messaggio dalla porta seriale
void checkIncomingData() {

  // se ci sono byte in arrivo dalla seriale
  if (Serial.available() > 0) {

    // salva il nuovo byte in arrivo
    char incomingChar = char(Serial.read());

    // aggiungilo alla stringa dove viene salvato il messaggio in entrata
    inputString += incomingChar;

    // se il byte in arrivo è un "\n" vuol dire che è la fine del messaggio
    if (incomingChar == '\n') {
      stringComplete = true;
    }
  }
}

void azzeraCounter() {
  if (stringComplete) {
    if (inputString == "azzera\n") {
      contatore = 0; // aggiorna di conseguenza la variabile
      Serial.print("Contatore: ");
      Serial.println(contatore);

      // aspetta un po' per non sovraccaricare la seriale
      delay(5);

      // ora che il messaggio è stato ricevuto, resetta la stringa per essere pronto per un nuovo messaggio
      inputString = "";
      stringComplete = false;
    }
  }
}
