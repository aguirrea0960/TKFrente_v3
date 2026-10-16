#include <TankMqttSettingsService.h>

TankMqttSettingsService::TankMqttSettingsService(AsyncWebServer* server, FS* fs, SecurityManager* securityManager) :
    _httpEndpoint(TankMqttSettings::read,
                  TankMqttSettings::update,
                  this,
                  server,
                  TANK_BROKER_SETTINGS_PATH,
                  securityManager,
                  AuthenticationPredicates::IS_AUTHENTICATED),
    _fsPersistence(TankMqttSettings::read, TankMqttSettings::update, this, fs, TANK_BROKER_SETTINGS_FILE) {
}

void TankMqttSettingsService::begin() {
  _fsPersistence.readFromFS();
}
