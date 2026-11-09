#include <DiagnosticsService.h>
#include <OTASettingsService.h>

OTASettingsService::OTASettingsService(AsyncWebServer *server, FS *fs,
                                       SecurityManager *securityManager)
    : _httpEndpoint(OTASettings::read, OTASettings::update, this, server,
                    OTA_SETTINGS_SERVICE_PATH, securityManager),
      _fsPersistence(OTASettings::read, OTASettings::update, this, fs,
                     OTA_SETTINGS_FILE),
      _arduinoOTA(nullptr) {
#ifdef ESP32
  WiFi.onEvent(std::bind(&OTASettingsService::onStationModeGotIP, this,
                         std::placeholders::_1, std::placeholders::_2),
               WiFiEvent_t::ARDUINO_EVENT_WIFI_STA_GOT_IP);
#elif defined(ESP8266)
  _onStationModeGotIPHandler = WiFi.onStationModeGotIP(std::bind(
      &OTASettingsService::onStationModeGotIP, this, std::placeholders::_1));
#endif
  addUpdateHandler([&](const String &originId) { configureArduinoOTA(); },
                   false);
}

void OTASettingsService::begin() {
  _fsPersistence.readFromFS();
  configureArduinoOTA();
}

void OTASettingsService::loop() {
  if (_state.enabled && _arduinoOTA) {
    _arduinoOTA->handle();
  }
}

void OTASettingsService::configureArduinoOTA() {
  if (_arduinoOTA) {
#ifdef ESP32
    _arduinoOTA->end();
#endif
    delete _arduinoOTA;
    _arduinoOTA = nullptr;
  }
  if (_state.enabled) {
    DiagnosticsService::log("OTA: Iniciando servicio...");
    _arduinoOTA = new ArduinoOTAClass;
    _arduinoOTA->setPort(_state.port);
    _arduinoOTA->setPassword(_state.password.c_str());
    _arduinoOTA->onStart(
        []() { DiagnosticsService::log("OTA: Inicio recepcion"); });
    _arduinoOTA->onEnd([]() { DiagnosticsService::log("OTA: Fin grabado"); });
    _arduinoOTA->onProgress([](unsigned int progress, unsigned int total) {
      // Evitar saturar logs durante progreso OTA
    });
    _arduinoOTA->onError([](ota_error_t error) {
      DiagnosticsService::log("OTA: Error[%u]", error);
    });
    _arduinoOTA->begin();
  }
}

#ifdef ESP32
void OTASettingsService::onStationModeGotIP(WiFiEvent_t event,
                                            WiFiEventInfo_t info) {
  configureArduinoOTA();
}
#elif defined(ESP8266)
void OTASettingsService::onStationModeGotIP(
    const WiFiEventStationModeGotIP &event) {
  configureArduinoOTA();
}
#endif
