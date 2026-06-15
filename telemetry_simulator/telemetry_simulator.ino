/*
  Wokwi-compatible CanSat telemetry simulator
  Streams CSV telemetry packets over Serial for the GCS dashboard.
*/

#include <Arduino.h>

constexpr uint32_t BAUD_RATE = 115200;
constexpr int TEAM_ID = 3042;

static float altitude = 100.0;
static float pressure = 1013.25;
static float temperature = 25.0;
static float voltage = 8.4;
static float gpsLat = 26.8539;
static float gpsLon = 80.9490;
static float gpsAlt = 0.0;
static int gpsSats = 12;
static float tiltX = 0.0;
static float tiltY = 0.0;
static float rotationRate = 0.0;
static float descentRate = 0.0;
static float missionTime = 0.0;
static uint32_t packetCount = 0;
static bool payloadSeparated = false;
static bool parachuteDeployed = false;

const char* currentState = "PRE-LAUNCH";

void setup() {
  randomSeed(analogRead(A0));
  Serial.begin(BAUD_RATE);
}

void loop() {
  // Simple mission phase progression for realistic testing in Wokwi.
  if (missionTime < 3.0) {
    altitude = 0.5 + random(-10, 11) * 0.1;
    pressure = 1013.25 + random(-5, 6) * 0.05;
    temperature = 25.0 + random(-10, 11) * 0.05;
    descentRate = 0.0;
    currentState = "PRE-LAUNCH";
  } else if (missionTime < 20.0) {
    altitude = min(700.0f, altitude + 8.0 + random(-5, 6) * 0.2);
    pressure = 1013.25 * exp(-altitude / 8500.0) + random(-5, 6) * 0.05;
    temperature = 25.0 - altitude * 0.0065 + random(-10, 11) * 0.02;
    descentRate = -9.0 + random(-10, 11) * 0.1;
    currentState = "ASCENT";
  } else if (missionTime < 40.0) {
    altitude = 700.0 + random(-20, 21) * 0.2;
    pressure = 1013.25 * exp(-altitude / 8500.0) + random(-5, 6) * 0.05;
    temperature = 25.0 - altitude * 0.0065 + random(-10, 11) * 0.02;
    descentRate = 0.0;
    currentState = "APOGEE";
  } else if (missionTime < 60.0) {
    altitude = max(650.0f, altitude - 3.0 + random(-10, 11) * 0.2);
    pressure = 1013.25 * exp(-altitude / 8500.0) + random(-5, 6) * 0.05;
    temperature = 25.0 - altitude * 0.0065 + random(-10, 11) * 0.02;
    descentRate = 3.0 + random(-10, 11) * 0.1;
    payloadSeparated = true;
    currentState = "SEPARATION";
  } else {
    altitude = max(0.0f, altitude - 9.0 + random(-10, 11) * 0.1);
    pressure = 1013.25 * exp(-altitude / 8500.0) + random(-5, 6) * 0.05;
    temperature = 25.0 - altitude * 0.0065 + random(-10, 11) * 0.02;
    descentRate = 9.0 + random(-10, 11) * 0.1;
    parachuteDeployed = true;
    currentState = "DESCENT";
  }

  voltage = max(6.0f, 8.4 - missionTime * 0.003 + random(-10, 11) * 0.001);
  gpsLat += random(-10, 11) * 0.00001;
  gpsLon += random(-10, 11) * 0.00001;
  gpsAlt = altitude;
  gpsSats = 8 + random(0, 5);
  tiltX = constrain(tiltX + random(-10, 11) * 0.2, -45.0f, 45.0f);
  tiltY = constrain(tiltY + random(-10, 11) * 0.2, -45.0f, 45.0f);
  rotationRate = random(-150, 151) * 0.1;

  // CSV packet expected by the GCS parser.
  Serial.print(TEAM_ID); Serial.print(',');
  Serial.print(missionTime, 1); Serial.print(',');
  Serial.print(packetCount); Serial.print(',');
  Serial.print("FLIGHT"); Serial.print(',');
  Serial.print(currentState); Serial.print(',');
  Serial.print(altitude, 2); Serial.print(',');
  Serial.print(pressure, 2); Serial.print(',');
  Serial.print(temperature, 2); Serial.print(',');
  Serial.print(voltage, 2); Serial.print(',');
  Serial.print(gpsLat, 6); Serial.print(',');
  Serial.print(gpsLon, 6); Serial.print(',');
  Serial.print(gpsAlt, 2); Serial.print(',');
  Serial.print(gpsSats); Serial.print(',');
  Serial.print(tiltX, 2); Serial.print(',');
  Serial.print(tiltY, 2); Serial.print(',');
  Serial.print(rotationRate, 2); Serial.print(',');
  Serial.print(descentRate, 2); Serial.print(',');
  Serial.print(payloadSeparated ? 1 : 0); Serial.print(',');
  Serial.print(parachuteDeployed ? 1 : 0); Serial.print(',');
  Serial.println("NONE");

  missionTime += 1.0;
  packetCount++;
  delay(1000);
}
