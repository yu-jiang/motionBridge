#include <Servo.h>

// MotionBridge Arduino Model Car Controller
// Target board: Arduino Uno (ATmega328P)
//
// This sketch is intended to be flashed to an Arduino Uno.
// It controls four servos connected to pins D5, D9, D10, and D11.
// The Arduino listens on the USB serial port at 115200 baud and
// expects lines of text containing four integer angles:
//
//   s1 s2 s3 s4\n
//
// For example:
//   90 45 120 0
//
// Each value is interpreted as a servo angle in degrees (0–180).
// On receiving a valid line, the sketch clamps the values to [0,180]
// and updates the four servos to those angles.

// Use names that don't clash with AVR macros
const uint8_t SERVO1_PIN = 5;   // D5
const uint8_t SERVO2_PIN = 9;   // D9
const uint8_t SERVO3_PIN = 10;  // D10
const uint8_t SERVO4_PIN = 11;  // D11

Servo servo1;
Servo servo2;
Servo servo3;
Servo servo4;

void setup() {
  Serial.begin(115200);

  servo1.attach(SERVO1_PIN);
  servo2.attach(SERVO2_PIN);
  servo3.attach(SERVO3_PIN);
  servo4.attach(SERVO4_PIN);

  // Optional: set initial positions
  servo1.write(90);
  servo2.write(90);
  servo3.write(90);
  servo4.write(90);
}

// Expect lines like:  90 45 120 0\n
void loop() {
  if (Serial.available()) {
    String line = Serial.readStringUntil('\n');

    int s1, s2, s3, s4;
    if (sscanf(line.c_str(), "%d %d %d %d", &s1, &s2, &s3, &s4) == 4) {
      s1 = constrain(s1, 0, 180);
      s2 = constrain(s2, 0, 180);
      s3 = constrain(s3, 0, 180);
      s4 = constrain(s4, 0, 180);

      servo1.write(s1);
      servo2.write(s2);
      servo3.write(s3);
      servo4.write(s4);
    }
  }
}
