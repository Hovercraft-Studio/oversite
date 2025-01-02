/*
======================================================================================================
Notes:
- Be sure to install the M5Stick/etc libraries
- Arduino IDE needs the ESP32 platform sources: 
  - https://randomnerdtutorials.com/installing-the-esp32-board-in-arduino-ide-windows-instructions/
- In Arduino's "Boards Manager" tab
  - Install the esp32 library by Expressif Systems
- In Arduino's "Library Manager" tab
  - Install the "Smoothed" library by Matthew Fryer
  - Install the "ArduinoWebsockets" library from gilmaimon
  - Install the "WebSockets" library by Markus Sattler
  - Install the "ArduinoJSON" library by Benoit Blanchon

======================================================================================================
Links:
- Device:
  - https://shop.m5stack.com/collections/m5-controllers/products/m5stickc-plus-esp32-pico-mini-iot-development-kit
- Official examples / docs:
  - https://github.com/m5stack/M5StickC-Plus/blob/master/examples/Basics/MPU6886/MPU6886.ino
  - https://github.com/m5stack/m5-docs/tree/master/docs/en/api
  - https://github.com/m5stack/M5StickC/blob/master/examples/Basics/FactoryTest
- Wifi / WebSockets
  - Use this one:
    - https://github.com/Links2004/arduinoWebSockets/blob/master/examples/esp32/WebSocketClient/WebSocketClient.ino
  - Not this one: (it doesn't have auto-reconnect)
    - https://github.com/gilmaimon/ArduinoWebsockets/blob/master/examples/Esp32-Client/Esp32-Client.ino
    - https://github.com/gilmaimon/ArduinoWebsockets/blob/master/examples/Minimal-Esp32-Client/Minimal-Esp32-Client.ino
    - https://github.com/gilmaimon/ArduinoWebsockets
    - https://github.com/gilmaimon/ArduinoWebsockets/issues/75 - reconnection strategies
  - https://m5stack.hackster.io/katsushun89/m5stack-synchronizing-the-colors-with-unity-fb8422
- Other:
  - https://www.hackster.io/shasha-liu/magic-wand-752f52
  - https://github.com/m5stack/MagicWand/blob/master/src/capture.cpp
- Sensor: E18-D80NK
  - https://www.instructables.com/Project-on-E18-D80NK-IR-Proximity-Sensor-With-Ardu/
  - https://www.amazon.com/dp/B0BGCGBSD6

======================================================================================================
*/

////////////////////////////////////////////////////
// includes
////////////////////////////////////////////////////

#include <Arduino.h>
#include <M5StickCPlus.h>
#include <WebSocketsClient.h>
#include <WiFi.h>
#include <WiFiMulti.h>
#include <ArduinoJson.h>

////////////////////////////////////////////////////
// network config
////////////////////////////////////////////////////

// - Wifi auth
const char* ssid = "TechHouse";
const char* password = "birdmagnet";

// - ws:// server 
//   - Use `sendonly=true` if this device shouldn't receive any messages
const char* websockets_server_host = "192.168.1.202";
const uint16_t websockets_server_port = 3001;
const char* sender = "esp32";
String serverPath = String("/ws?sendonly=true&sender=") + sender;
const char* websockets_server_path = serverPath.c_str();

////////////////////////////////////////////////////
// network objects
////////////////////////////////////////////////////

WiFiMulti WiFiMulti;
WebSocketsClient webSocket;
bool wsConnected = false;
long lastNetworkPollTime = 0;
int networkPollTimeInterval = 20; // how fast to send/receive ws messages
long lastHeartbeatTime = 0;
int heartbeatInterval = 5000;


////////////////////////////////////////////////////
// force reboot helper
////////////////////////////////////////////////////

void(* Reboot)(void) = 0;

////////////////////////////////////////////////////
// sensor & ws:// output timing
////////////////////////////////////////////////////

int inputPin = 25;
int sensorValue = 0;
long lastSensorTime = 0;
int sensorInterval = 1;
int sensorTimeout = 300;
int sensorTriggerTime = 0;

////////////////////////////////////////////////////
// LCD screen refresh interval
////////////////////////////////////////////////////

long lastDrawTime = 0;

////////////////////////////////////////////////////
// device active/inactive - toggle with large button
////////////////////////////////////////////////////

bool active = true;


void setup() {
  Serial.begin(115200);
  initLCD();
  initNetwork();
  initSensor();
}

void initLCD() {
  M5.begin();                // Init M5StickC Plus
  M5.Imu.Init();             // Init IMU
  M5.Lcd.setRotation(0);     // Rotate the screen
}

void loop() {
  if(active) {
    updateSensors();
    sendReadings();
  }
  drawReadings();
  networkLoop();
  sendHeartbeat();
  checkButtonClick();
  delay(10); // 100hz
}

void initSensor() {
  pinMode(inputPin, INPUT);
}

void updateSensors() {
  if(!updateAllowed(lastSensorTime, sensorInterval)) return;
  int newVal = digitalRead(inputPin);
  if(newVal != sensorValue) {
    sendKeyValue("sensor_value_1", newVal);
  }
  sensorValue = newVal;
  if(sensorValue == 0) {
    sensorTriggerTime = millis();
  }
}

void sendKeyValue(String key, float value) {
  // Create a JSON document & add key-value pairs
  JsonDocument doc;
  doc["key"] = key;
  doc["value"] = value;
  doc["store"] = true;
  doc["type"] = "number";
  doc["sender"] = sender;
  doc["sendonly"] = true; // don't receive bounce-back for these messages
  
  // Serialize the JSON document to a string & send the string via WebSocket
  String msg;
  serializeJson(doc, msg);
  webSocket.sendTXT(msg);
}

void sendReadings() {
  if(!updateAllowed(lastSensorTime, sensorInterval)) return;
  // sendKeyValue("motion_total", motionTotal);
}

void drawReadings() {
  // only draw on a reasonable interval
  if(!updateAllowed(lastDrawTime, 50)) return;

  // title
  M5.Lcd.setTextColor(WHITE, BLACK);
  M5.Lcd.setCursor(10, 10);
  M5.Lcd.println("MPU6886 Accel/Gyro");
  
  // network connectivity
  drawConnectionStatus(10, 30, "Wifi ", (WiFi.status() == WL_CONNECTED));
  drawConnectionStatus(10, 45, "ws://", wsConnected);
  M5.Lcd.setTextColor(WHITE, BLACK);

  // sensor value
  int sensorColor = (millis() - sensorTriggerTime < sensorTimeout) ? GREEN : RED;
  M5.Lcd.drawFastHLine(10, 60, 100, sensorColor);
  M5.Lcd.setCursor(10, 70);
  M5.Lcd.println(sensorValue);
  // M5.Lcd.setCursor(10, 85);
  // M5.Lcd.println(sensorValAnalog);
}

void drawConnectionStatus(int x, int y, String connectionLabel, bool isConnected) {
  int statusColor = (isConnected) ? GREEN : RED;
  String statusStr = (isConnected) ? " CONNECTED   " : " DISCONNECTED";
  M5.Lcd.setTextColor(statusColor, BLACK);
  M5.Lcd.setCursor(x, y);
  M5.Lcd.println(connectionLabel + statusStr);
}

void checkButtonClick() {
  M5.update();  // Read the press state of the key
  if (M5.BtnA.wasReleased()) {
    active = !active;
    sendKeyValue("m5stick_front_button_pressed", active ? 1 : 0);

    // check active flag for bg color
    int bgColor = (active) ? BLACK : RED;
    M5.Lcd.fillScreen(bgColor);
  }
  if (M5.BtnB.wasReleased()) {
    Reboot();
  }
}

void initNetwork() {
  initWifi();
  initWebSockets();
}

void initWifi() {
  // Connect to wifi
  WiFiMulti.addAP(ssid, password);
  while(WiFiMulti.run() != WL_CONNECTED) {
    delay(100);
  }
  Serial.println("Connected to Wifi, Connecting to server.");
}

void initWebSockets() {
  // try to connect to Websockets server
  webSocket.begin(websockets_server_host, websockets_server_port, websockets_server_path);
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      wsConnected = false;
      Serial.println("[WSc] Disconnected!\n");
      break;
    case WStype_CONNECTED:
      wsConnected = true;
      sendKeyValue("client_connected", millis());
      Serial.printf("[WSc] Connected to url: %s\n", payload);
      break;
    case WStype_TEXT:
      Serial.printf("[WSc] get text: %s\n", payload);
      break;
    case WStype_ERROR:	
      Serial.printf("[WSc] ERROR: %s\n", payload);
      wsConnected = false;
      break;
  }
}

void networkLoop() {
  // only update on a reasonable interval
  // but make it quick, because if the messages queue gets too big, the app will crash!
  if(!updateAllowed(lastNetworkPollTime, networkPollTimeInterval)) return;
  // tell the websockets client check for incoming messages
  webSocket.loop();
}

void sendHeartbeat() {
  // send heartbeat every 5 seconds
  if(!updateAllowed(lastHeartbeatTime, heartbeatInterval)) return;
  sendKeyValue(String(sender) + "_heartbeat", millis());
}

bool updateAllowed(long& lastExecTime, int interval) {
  int now = millis();
  if (now < lastExecTime + interval) {
    return false;
  } else {
    lastExecTime = now;
    return true;
  }
}

