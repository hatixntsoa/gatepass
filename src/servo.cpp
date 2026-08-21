#include "servo.h"

// ── Module-level state ────────────────────────────────────────────────────────
static Servo _servo;
static bool  _isLocked = true;  // Assume locked on boot

// ── Low-level API ─────────────────────────────────────────────────────────────

void servoInit() {
    ESP32PWM::allocateTimer(0);
    _servo.setPeriodHertz(SERVO_FREQ_HZ);
    _servo.attach(SERVO_PIN, 500, 2400);
    stop();  // Ensure it doesn't spin on boot
    _isLocked = true;
    Serial.println("[Servo] Continuous servo initialised on GPIO " + String(SERVO_PIN));
    Serial.println("[Servo] State: LOCKED");
}

void stop() {
    _servo.writeMicroseconds(SERVO_STOP_US);
    Serial.println("[Servo] Stopped (µs=" + String(SERVO_STOP_US) + ")");
}

void turn_left(int durationMs) {
    Serial.println("[Servo] Turning LEFT (CCW) for " + String(durationMs) + " ms...");
    _servo.writeMicroseconds(SERVO_CCW_US);
    delay(durationMs);
    stop();
}

void turn_right(int durationMs) {
    Serial.println("[Servo] Turning RIGHT (CW) for " + String(durationMs) + " ms...");
    _servo.writeMicroseconds(SERVO_CW_US);
    delay(durationMs);
    stop();
}

// ── High-level door API ───────────────────────────────────────────────────────

void unlockDoor() {
    if (!_isLocked) {
        Serial.println("[Servo] Already unlocked, skipping.");
        return;
    }

    Serial.println("[Servo] Unlocking...");
    turn_right(UNLOCK_DURATION_MS);
    _isLocked = false;
    Serial.println("[Servo] Door UNLOCKED. Waiting " + String(DOOR_OPEN_MS / 1000) + " s...");

    delay(DOOR_OPEN_MS);

    lockDoor();
}

void lockDoor() {
    if (_isLocked) {
        Serial.println("[Servo] Already locked, skipping.");
        return;
    }

    Serial.println("[Servo] Locking...");
    turn_left(LOCK_DURATION_MS);
    _isLocked = true;
    Serial.println("[Servo] Door LOCKED.");
}