#include <WiFi.h>
#include <WebServer.h>
#include <SPIFFS.h>

#define moistureSensorPin1 34
#define pumpPin1 14
#define pumpPin2 27
#define waterTankSensorPin 35
#define fertTankSensorPin 32

const char *ssid = "Marc Gabriel's A12";
const char *password = "12341234";

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

void handleData() {
    int moistureLevel = analogRead(moistureSensorPin1);
    Serial.println("Raw Moisture Reading: " + String(moistureLevel));

    int moisturePercentage = map(moistureLevel, 850, 2200, 100, 0);
    moisturePercentage = constrain(moisturePercentage, 0, 100);

    if (autoMode) {
        if (moisturePercentage < 35) pump1Status = true;
        if (moisturePercentage > 50) pump1Status = false;
        digitalWrite(pumpPin1, pump1Status ? HIGH : LOW);
    }

    waterTankLevel = map(analogRead(waterTankSensorPin), 500, 3000, 0, 100);
    fertTankLevel = map(analogRead(fertTankSensorPin), 500, 3000, 0, 100);
    waterTankLevel = constrain(waterTankLevel, 0, 100);
    fertTankLevel = constrain(fertTankLevel, 0, 100);

    String json = "{";
    json += "\"moisture\":" + String(moisturePercentage) + ",";
    json += "\"pump\":" + String(pump1Status) + ",";
    json += "\"pump2\":" + String(pump2Status) + ",";
    json += "\"autoMode\":" + String(autoMode) + ",";
    json += "\"waterTankLevel\":" + String(waterTankLevel) + ",";
    json += "\"fertTankLevel\":" + String(fertTankLevel);
    json += "}";

    server.send(200, "application/json", json);
}

void handleTogglePump() {
    if (!autoMode) {
        pump1Status = !pump1Status;
        digitalWrite(pumpPin1, pump1Status ? HIGH : LOW);
    }
    server.sendHeader("Location", "/", true);
    server.send(303);
}

void handleTogglePump2() {
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

void setup() {
    Serial.begin(115200);
    pinMode(pumpPin1, OUTPUT);
    digitalWrite(pumpPin1, LOW);
    pinMode(pumpPin2, OUTPUT);
    digitalWrite(pumpPin2, LOW);

    if (!SPIFFS.begin(true)) {
        Serial.println("SPIFFS Mount Failed");
        return;
    }

    WiFi.begin(ssid, password);
    Serial.print("Connecting to WiFi...");
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nWiFi connected.");
    Serial.println(WiFi.localIP());

    server.on("/", []() { handleFileRequest("/index.html"); });
    server.on("/style.css", []() { handleFileRequest("/style.css"); });
    server.on("/script.js", []() { handleFileRequest("/script.js"); });

    server.on("/togglePump", handleTogglePump);
    server.on("/togglePump2", handleTogglePump2);
    server.on("/toggleMode", handleToggleMode);
    server.on("/data", handleData);

    server.begin();
}

void loop() {
    server.handleClient();
}
