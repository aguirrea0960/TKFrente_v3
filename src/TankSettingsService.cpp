#include <TankSettingsService.h>

TankSettingsService::TankSettingsService(AsyncWebServer* server, FS* fs, SecurityManager* securityManager) :
    _httpEndpoint(TankSettings::read,
                  TankSettings::update,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
                  this,
                  server,
                  TANK_SETTINGS_PATH,
                  securityManager,
                  AuthenticationPredicates::IS_AUTHENTICATED),
    _fsPersistence(TankSettings::read, TankSettings::update, this, fs, TANK_SETTINGS_FILE) {
}

void TankSettingsService::begin() {
  _fsPersistence.readFromFS();
}

uint8_t TankSettingsService::readMax(){
  return TankSettingsService::_state.level_max;
}

uint8_t TankSettingsService::readMin(){
  return TankSettingsService::_state.level_min;
}

uint8_t TankSettingsService::readRiegTime(){
  return TankSettingsService::_state.rieg_time;
}

uint8_t TankSettingsService::readVSOperTime(){
  return TankSettingsService::_state.vs_toper;
}

uint8_t TankSettingsService::readVSOpenTime50(){
  return TankSettingsService::_state.vs_topen50;
}

uint8_t TankSettingsService::readVSOpenTime25(){                                                         
  return TankSettingsService::_state.vs_topen25;
}

bool TankSettingsService::readHLS_InvFlag(){
  return TankSettingsService::_state.hls_Inverted;
}

String TankSettingsService::readPumpHost(){
  return TankSettingsService::_state.pump_host.length() > 0 ? TankSettingsService::_state.pump_host : FACTORY_PUMP_HOST;
}


bool TankSettingsService::readManualMv01(){
  return TankSettingsService::_state.manual_mv01;
}
