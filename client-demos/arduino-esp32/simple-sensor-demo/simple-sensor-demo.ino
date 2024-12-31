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
const char* websockets_server_host = "192.168.1.202";
const uint16_t websockets_server_port = 3001;
const char* sender = "esp32";
String serverPath = String("/ws?sender=") + sender;
const char* websockets_server_path = serverPath.c_str();

////////////////////////////////////////////////////
// network objects
////////////////////////////////////////////////////

WiFiMulti WiFiMulti;
WebSocketsClient webSocket;
bool wsConnected = false;
long lastNetworkPollTime = 0;
int networkPollTimeInterval = 20; // how fast to send ws messages
long lastHeartbeatTime = 0;
int heartbeatInterval = 5000;


////////////////////////////////////////////////////
// force reboot helper
////////////////////////////////////////////////////

void(* Reboot)(void) = 0;

////////////////////////////////////////////////////
// swing detection
////////////////////////////////////////////////////

long lastSendTime = 0;
int sendReadingsInterval = 30;

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
  networkLoop();
  sendHeartbeat();
  checkButtonClick();
  delay(20); // 50fps
}

void updateSensors() {

}

void sendKeyValue(String key, float value) {
  // Create a JSON document & add key-value pairs
  JsonDocument doc;
  doc["key"] = key;
  doc["value"] = value;
  doc["store"] = true;
  doc["type"] = "number";
  doc["sender"] = sender;
  
  // Serialize the JSON document to a string & send the string via WebSocket
  String msg;
  serializeJson(doc, msg);
  webSocket.sendTXT(msg);
}

void sendReadings() {
  if(!updateAllowed(lastSendTime, sendReadingsInterval)) return;
  // sendKeyValue("motion_total", motionTotal);
}

void drawReadings() {
  // only draw on a reasonable interval
  if(!updateAllowed(lastDrawTime, 50)) return;

  // screen measurements
  int centerX = M5.Lcd.width() / 2;

  // title
  M5.Lcd.setTextColor(WHITE, BLACK);
  M5.Lcd.setCursor(10, 10);
  M5.Lcd.println("MPU6886 Accel/Gyro");
  
  // sensors
  // drawReading(30, "Gyro X", gyroX_.get(), 1, RED);
  // drawReading(45, "Gyro Y", gyroY_.get(), 1, GREEN);
  // drawReading(60, "Gyro Z", gyroZ_.get(), 1, YELLOW);

  // drawReading(90, "Accel X", accX_.get(), 30, RED);
  // drawReading(105, "Accel Y", accY_.get(), 30, GREEN);
  // drawReading(120, "Accel Z", accZ_.get(), 30, YELLOW);

  // drawReading(210, "Motion", (int) motionTotal, 0.01, GREEN, 10);  

  // bat state
  // M5.Lcd.setCursor(10, 150);
  // M5.Lcd.print("Position");
  // M5.Lcd.setCursor(80, 150);
  // if(position == UP) M5.Lcd.print("UP  ");
  // if(position == FLAT) M5.Lcd.print("FLAT");
  // if(position == DOWN) M5.Lcd.print("DOWN");

  // network connectivity
  drawConnectionStatus(10, 165, "Wifi ", (WiFi.status() == WL_CONNECTED));
  drawConnectionStatus(10, 180, "ws://", wsConnected);
  M5.Lcd.setTextColor(WHITE, BLACK);

  // M5.Lcd.setCursor(10, 230);
  // M5.Lcd.printf("Temperature : %.2f C", temp_.get());
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
    int bgColor = (active) ? BLACK : RED;
    M5.Lcd.fillScreen(bgColor);
    sendKeyValue("m5stick_button_pressed", 1);
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
      sendKeyValue("arduino_connected", millis());
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
  // but make it quick, because if messages get queued too much, the app will crash!
  if(!updateAllowed(lastNetworkPollTime, networkPollTimeInterval)) return;

  // let the websockets client check for incoming messages
  webSocket.loop();
}

void sendHeartbeat() {
  // only update on a reasonable interval
  // but make it quick, because if messages get queued too much, the app will crash!
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

