#ifndef TankMqttSettingsService_h
#define TankMqttSettingsService_h

#include <HttpEndpoint.h>
#include <FSPersistence.h>
#include <SettingValue.h>

#define TANK_BROKER_SETTINGS_FILE "/config/brokerSettings.json"
#define TANK_BROKER_SETTINGS_PATH "/rest/brokerSettings"

class TankMqttSettings {
 public:
  String mqttPath;
  String name;
  String uniqueId;
  
  static void read(TankMqttSettings& settings, JsonObject& root) {
    root["mqtt_path"] = settings.mqttPath;
    root["name"]      = settings.name;
    root["unique_id"] = settings.uniqueId;
  }

  static StateUpdateResult update(JsonObject& root, TankMqttSettings& settings) {
    settings.mqttPath = root["mqtt_path"] | SettingValue::format("water/tank/#{unique_id}");
    settings.name     = root["name"] | SettingValue::format("TK-#{unique_id}");
    settings.uniqueId = root["unique_id"] | SettingValue::format("tank-#{unique_id}");
    return StateUpdateResult::CHANGED;
  }
};

class TankMqttSettingsService : public StatefulService<TankMqttSettings> {
 public:
  TankMqttSettingsService(AsyncWebServer* server, FS* fs, SecurityManager* securityManager);
  void begin();

 private:
  HttpEndpoint<TankMqttSettings> _httpEndpoint;
  FSPersistence<TankMqttSettings> _fsPersistence;
};

#endif  // end TankMqttSettingsService_h
