#include <DiagnosticsService.h>

#ifdef ESP32
#include <WiFi.h>
#include <esp_system.h>
#elif defined(ESP8266)
#include <ESP8266WiFi.h>
#endif

static DiagLogEntry diagLogs[DIAG_LOG_MAX];
static uint8_t diagHead = 0;
static uint8_t diagCount = 0;

DiagnosticsService::DiagnosticsService(AsyncWebServer *server)
    : _server(server) {}

void DiagnosticsService::begin() {
  _server->on(DIAG_ENDPOINT_PATH, HTTP_GET,
              std::bind(&DiagnosticsService::handleDiagnostics, this,
                        std::placeholders::_1));
}

void DiagnosticsService::log(const char *fmt, ...) {
  DiagLogEntry &entry = diagLogs[diagHead];
  entry.t = millis() / 1000;

  va_list args;
  va_start(args, fmt);
  vsnprintf(entry.msg, DIAG_MSG_LEN, fmt, args);
  va_end(args);

  diagHead = (diagHead + 1) % DIAG_LOG_MAX;
  if (diagCount < DIAG_LOG_MAX) {
    diagCount++;
  }
}

#ifdef ESP32
static const char *getEsp32ResetReasonStr(esp_reset_reason_t r) {
  switch (r) {
    case ESP_RST_POWERON:   return "Power-on reset";
    case ESP_RST_EXT:       return "External reset";
    case ESP_RST_SW:        return "Software/System restart";
    case ESP_RST_PANIC:     return "Exception / Panic";
    case ESP_RST_INT_WDT:   return "Interrupt watchdog reset";
    case ESP_RST_TASK_WDT:  return "Task watchdog reset";
    case ESP_RST_WDT:       return "Other watchdog reset";
    case ESP_RST_DEEPSLEEP: return "Deep sleep wake";
    case ESP_RST_BROWNOUT:  return "Brownout reset";
    case ESP_RST_SDIO:      return "SDIO reset";
    default:                return "Unknown";
  }
}
#endif

void DiagnosticsService::handleDiagnostics(AsyncWebServerRequest *request) {
  AsyncJsonResponse *response = new AsyncJsonResponse(false, 2560);
  JsonObject root = response->getRoot();

  root["uptime"] = millis() / 1000;

#ifdef ESP32
  esp_reset_reason_t reason = esp_reset_reason();
  root["reset_reason"] = getEsp32ResetReasonStr(reason);
  root["reset_code"] = (int)reason;
  root["exccause"] = 0;
  root["epc1"] = "0x00000000";
  root["excvaddr"] = "0x00000000";

  uint32_t freeH = ESP.getFreeHeap();
  root["free_heap"] = freeH;
  root["max_free_block"] = ESP.getMaxAllocHeap();
  root["heap_fragmentation"] = 0;
  root["cpu_freq"] = ESP.getCpuFreqMHz();

#elif defined(ESP8266)
  root["reset_reason"] = ESP.getResetReason();

  rst_info *rinfo = ESP.getResetInfoPtr();
  if (rinfo) {
    root["reset_code"] = rinfo->reason;
    root["exccause"] = rinfo->exccause;
    char hexBuf[12];
    sprintf(hexBuf, "0x%08x", (unsigned int)rinfo->epc1);
    root["epc1"] = hexBuf;
    sprintf(hexBuf, "0x%08x", (unsigned int)rinfo->excvaddr);
    root["excvaddr"] = hexBuf;
  } else {
    root["reset_code"] = -1;
  }

  uint32_t freeH = ESP.getFreeHeap();
  root["free_heap"] = freeH;
  root["max_free_block"] = freeH;
  root["heap_fragmentation"] = 0;
  root["cpu_freq"] = ESP.getCpuFreqMHz();
#endif

  root["wifi_connected"] = WiFi.isConnected();
  root["wifi_rssi"] = WiFi.RSSI();
  root["wifi_ip"] = WiFi.localIP().toString();

  JsonArray logsArray = root.createNestedArray("logs");
  int startIdx = (diagCount == DIAG_LOG_MAX) ? diagHead : 0;
  for (int i = 0; i < diagCount; i++) {
    int idx = (startIdx + i) % DIAG_LOG_MAX;
    JsonObject obj = logsArray.createNestedObject();
    obj["t"] = diagLogs[idx].t;
    obj["msg"] = diagLogs[idx].msg;
  }

  response->setLength();
  request->send(response);
}

