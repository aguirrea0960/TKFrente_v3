#ifndef DIAGNOSTICS_SERVICE_H
#define DIAGNOSTICS_SERVICE_H

#include <Arduino.h>
#include <ESPAsyncWebServer.h>
#include <ArduinoJson.h>
#include <AsyncJson.h>

#define DIAG_LOG_MAX 32
#define DIAG_MSG_LEN 56
#define DIAG_ENDPOINT_PATH "/rest/diagnostics"

struct DiagLogEntry {
  uint32_t t;
  char msg[DIAG_MSG_LEN];
};

class DiagnosticsService {
public:
  DiagnosticsService(AsyncWebServer *server);
  void begin();
  static void log(const char *fmt, ...);

private:
  AsyncWebServer *_server;
  void handleDiagnostics(AsyncWebServerRequest *request);
};

#endif // DIAGNOSTICS_SERVICE_H

