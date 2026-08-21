#include <Keypad.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include "servo.h"

#define BUZZ_PIN        23
#define PASSWORD_LENGTH 4

// LCD: address 0x27, 16 columns, 2 rows (change address to 0x3F if 0x27 doesn't work)
LiquidCrystal_I2C lcd(0x27, 16, 2);

const byte ROWS = 4;
const byte COLS = 4;

char keys[ROWS][COLS] = {
  {'1','2','3','A'},
  {'4','5','6','B'},
  {'7','8','9','C'},
  {'*','0','#','D'}
};

byte rowPins[ROWS] = {18, 19, 14, 27};
byte colPins[COLS]  = {26, 25, 33, 32};

Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);

const String PASSWORD = "1111";
String inputPassword  = "";

void correctBuzz() {
  digitalWrite(BUZZ_PIN, HIGH);
  delay(500);
  digitalWrite(BUZZ_PIN, LOW);
}

void wrongBuzz() {
  for (int i = 0; i < 3; i++) {
    digitalWrite(BUZZ_PIN, HIGH);
    delay(200);
    digitalWrite(BUZZ_PIN, LOW);
    delay(200);
  }
}

void checkPassword() {
  if (inputPassword == PASSWORD) {
    Serial.println("Access GRANTED");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Correct Password");
    correctBuzz();
    unlockDoor();
  } else {
    Serial.println("Access DENIED");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Wrong Password");
    wrongBuzz();
  }
  inputPassword = "";

  // Return to prompt after 2 seconds
  delay(2000);
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Enter Password:");
  lcd.setCursor(0, 1);
}

void setup() {
  Serial.begin(115200);
  pinMode(BUZZ_PIN, OUTPUT);
  digitalWrite(BUZZ_PIN, LOW);

  servoInit();

  // LCD init
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Enter Password:");

  Serial.println("Smart Door Lock System Ready");
  Serial.println("Enter " + String(PASSWORD_LENGTH) + "-digit password:");
}

void loop() {
  char key = keypad.getKey();
  if (!key) return;

  Serial.println("Key pressed: " + String(key));

  digitalWrite(BUZZ_PIN, HIGH);
  delay(100);
  digitalWrite(BUZZ_PIN, LOW);

  if (key == '*') {
    for (int i = 0; i < 2; i++) {
      digitalWrite(BUZZ_PIN, HIGH);
      delay(100);
      digitalWrite(BUZZ_PIN, LOW);
      delay(100);
    }
    inputPassword = "";
    Serial.println("Password cleared");

    // Reset LCD
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Enter Password:");
    lcd.setCursor(0, 1);
    return;
  }

  inputPassword += key;
  Serial.println("Input so far: " + String(inputPassword.length()) + "/" + String(PASSWORD_LENGTH));

  // Show typed characters progressively on row 1
  lcd.setCursor(0, 1);
  lcd.print(inputPassword);

  if ((int)inputPassword.length() == PASSWORD_LENGTH) {
    checkPassword();
  }
}