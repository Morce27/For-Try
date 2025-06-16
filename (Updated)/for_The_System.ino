#include <WiFi.h>
#include <WebServer.h>
#include <SPIFFS.h>

// Define pins
#define MOIST_PIN 34
#define PUMP1_PIN 14
#define PUMP2_PIN 27
#define WATER_PIN 35
#define FERT_PIN 32

const char* ssid = "Main_GabNicoMac 2.4G";
const char* password = "#BeStrong_2025";
WebServer server(80);   

// System state
bool pump1Status = false;
bool autoMode = true;
bool pump2Status = false;

int waterLevel = 0;
int fertLevel = 0;
int moisture = 0;

void handleFile(String path) {
  if (path.endsWith("/")) path += "index.html";
  String ct = path.endsWith(".css") ? "text/css" :
              path.endsWith(".js")  ? "application/javascript" :
                                      "text/html";
  File f = SPIFFS.open(path, "r");
  if (!f) return server.send(404, "text/plain", "Not found");
  server.streamFile(f, ct);
  f.close();
}

void handleData() {
  // Read moisture
  int raw = analogRead(MOIST_PIN);
  moisture = constrain(map(raw, 2545, 4095, 100, 0), 0, 100);

  // Auto mode logic
  if (autoMode) {
    if (moisture < 30) {
      pump1Status = true;
    } else if (moisture > 60) {
      pump1Status = false;
    }
    digitalWrite(PUMP1_PIN, pump1Status ? HIGH : LOW);
  }

  // Tank levels
  waterLevel = constrain(map(analogRead(WATER_PIN), 500, 3000, 0, 100), 0, 100);
  fertLevel  = constrain(map(analogRead(FERT_PIN), 500, 3000, 0, 100), 0, 100);

  // Respond with JSON
  String json = "{";
  json += "\"moisture\":" + String(moisture) + ",";
  json += "\"pump\":" + String(pump1Status ? 1 : 0) + ",";
  json += "\"pump2\":" + String(pump2Status ? 1 : 0) + ",";
  json += "\"autoMode\":" + String(autoMode ? 1 : 0) + ",";
  json += "\"waterTankLevel\":" + String(waterLevel) + ",";
  json += "\"fertTankLevel\":" + String(fertLevel);
  json += "}";

  server.send(200, "application/json", json);
}

void handleTogglePump() {
  if (!autoMode) {
    pump1Status = !pump1Status;
    digitalWrite(PUMP1_PIN, pump1Status ? HIGH : LOW);
  }
  server.sendHeader("Location", "/", true);
  server.send(303);
}

void handleTogglePump2() {
  pump2Status = !pump2Status;
  digitalWrite(PUMP2_PIN, pump2Status ? HIGH : LOW);
  server.sendHeader("Location", "/", true);
  server.send(303);
}

void handleToggleMode() {
  autoMode = !autoMode;
  if (autoMode) {
    pump1Status = false;
    digitalWrite(PUMP1_PIN, LOW);
  }
  server.sendHeader("Location", "/", true);
  server.send(303);
}

void setup() {
  Serial.begin(115200);
  pinMode(PUMP1_PIN, OUTPUT); digitalWrite(PUMP1_PIN, LOW);
  pinMode(PUMP2_PIN, OUTPUT); digitalWrite(PUMP2_PIN, LOW);

  if (!SPIFFS.begin(true)) {
    Serial.println("SPIFFS mount failed!");
    return;
  }

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println("\nConnected! IP: " + WiFi.localIP().toString());

  // Route handlers
  server.on("/",            [](){ handleFile("/index.html"); });
  server.on("/style.css",   [](){ handleFile("/style.css"); });
  server.on("/script.js",   [](){ handleFile("/script.js"); });
  server.on("/data",        handleData);
  server.on("/togglePump",  HTTP_GET, handleTogglePump);
  server.on("/togglePump2", HTTP_GET, handleTogglePump2);
  server.on("/toggleMode",  HTTP_GET, handleToggleMode);

  server.begin();
}

void loop() {
  server.handleClient();
}
