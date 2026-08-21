#ifndef CONTINU_SERVO_H
#define CONTINU_SERVO_H

#include <ESP32Servo.h>

// ─────────────────────────────────────────────
//  PIN WIRING GUIDE (ESP32 → Continuous Servo)
//
//  Servo Wire   │  Color (standard)  │  ESP32 Pin
//  ─────────────┼────────────────────┼───────────
//  GND          │  Brown / Black     │  GND
//  VCC          │  Red               │  VIN (5V) or external 5V
//  Signal       │  Orange / Yellow   │  GPIO 25
//
//  ⚠️  For continuous rotation servos, writeMicroseconds()
//      controls SPEED & DIRECTION:
//
//      writeMicroseconds(1500)         → STOP  (tune SERVO_STOP_US if drifting)
//      writeMicroseconds(1000)         → Full speed CCW  (Counter-Clockwise)
//      writeMicroseconds(2000)         → Full speed CW   (Clockwise)
//      writeMicroseconds(1200–1490)    → Slow CCW
//      writeMicroseconds(1510–1800)    → Slow CW
//
//  ⚠️  turn_left / turn_right are time-based:
//      the servo runs for a set duration then stops.
//      Tune UNLOCK_DURATION_MS / LOCK_DURATION_MS to match your bolt travel.
// ─────────────────────────────────────────────

#define SERVO_PIN           12      // GPIO 25 → Signal wire
#define SERVO_FREQ_HZ       50      // Standard PWM frequency

// ── Pulse widths (µs) ────────────────────────────────────────────────────────
// writeMicroseconds() is used throughout — avoids write() integer rounding
// that causes drift at the neutral point.
#define SERVO_STOP_US       1500    // True stop — tune ±10 µs if servo drifts
#define SERVO_CW_US         1800    // Slow CW  → Lock direction   (tune me)
#define SERVO_CCW_US        1200    // Slow CCW → Unlock direction  (tune me)
#define SERVO_CW_FAST_US    2000    // Full speed CW
#define SERVO_CCW_FAST_US   1000    // Full speed CCW

// ── Timing (ms) ──────────────────────────────────────────────────────────────
#define UNLOCK_DURATION_MS  300     // How long to spin to unlock   (tune me)
#define LOCK_DURATION_MS    300     // How long to spin to lock     (tune me)
#define DOOR_OPEN_MS        3000    // How long the door stays open

// ── Low-level API ─────────────────────────────────────────────────────────────

// Initialise the servo (call once in setup())
void servoInit();

// Stop immediately — uses writeMicroseconds(SERVO_STOP_US), no drift
void stop();

// Spin for a fixed duration then stop automatically
void turn_left(int durationMs);   // CCW
void turn_right(int durationMs);  // CW

// ── High-level door API ───────────────────────────────────────────────────────

// Spin to unlock → wait DOOR_OPEN_MS → spin to lock
void unlockDoor();

// Spin to lock position only
void lockDoor();

#endif // CONTINU_SERVO_H