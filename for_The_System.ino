#include <WiFi.h>
#include <WebServer.h>
#include <SPIFFS.h>

#define moistureSensorPin1 34 // 
#define pumpPin1 14 // Water pump
#define pumpPin2 27 // Fertilizer pump
#define waterTankSensorPin 35 // Analog pin for water tank level
#define fertTankSensorPin 32 // Analog pin for fertilizer tank level

const char *ssid = " wifi name "; // kasama sa nabago
const char *password = " wifi pass "; // kasama sa nabago

WebServer server(80);

bool pump1Status = false;
bool autoMode = true;
bool pump2Status = false;
int waterTankLevel = 0;
int fertTankLevel = 0;

void handleFileRequest(String path) {
    if (path.endsWith("/")) path += "index.html";
    String contentType = "text/plain";

    if (path.endsWith("index.html")) contentType = "text/html";
    else if (path.endsWith("style.css")) contentType = "text/css";
    else if (path.endsWith("script.js")) contentType = "application/javascript";

    File file = SPIFFS.open(path, "r");
    if (!file) {
        server.send(404, "text/plain", "File Not Found");
        return;
    }
    server.streamFile(file, contentType);
    file.close();
}

void handleData() 
//from this part
{
  // Read moisture
  int raw = analogRead(MOIST_PIN);
  moisture = constrain(map(raw, 2545, 4095, 100, 0), 0, 100); // Values adjusted

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
// to this part - all the sensors and relays

void handleTogglePump() {
    if (!autoMode) {
        pump1Status = !pump1Status;
        digitalWrite(pumpPin1, pump1Status ? HIGH : LOW);
    }
    server.sendHeader("Location", "/", true);
    server.send(303);
}

void handleTogglePump2() { // water pump
    pump2Status = !pump2Status;
    digitalWrite(pumpPin2, pump2Status ? HIGH : LOW);
    server.sendHeader("Location", "/", true);
    server.send(303);
}

void handleToggleMode() {
    autoMode = !autoMode;
    if (autoMode) {
        pump1Status = false;
        digitalWrite(pumpPin1, LOW);
    }
    server.sendHeader("Location", "/", true);
    server.send(303);
}
//also changed
void setup() {
  Serial.begin(115200);
  pinMode(PUMP1_PIN, OUTPUT); digitalWrite(PUMP1_PIN, LOW);
  pinMode(PUMP2_PIN, OUTPUT); digitalWrite(PUMP2_PIN, LOW);

  if (!SPIFFS.begin(true)) {
    Serial.println("SPIFFS mount failed!");
    return;
  }

  //also changed
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
