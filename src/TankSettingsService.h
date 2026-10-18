#ifndef TankSettingsService_h
#define TankSettingsService_h

#include <HttpEndpoint.h>
#include <FSPersistence.h>
#include <SettingValue.h>

#define TANK_SETTINGS_FILE "/config/tankSettings.json"
#define TANK_SETTINGS_PATH "/rest/tankSettings"

#ifndef FACTORY_TANK_MIN_LEVEL
#define FACTORY_TANK_MIN_LEVEL 145
#endif

#ifndef FACTORY_TANK_MAX_LEVEL
#define FACTORY_TANK_MAX_LEVEL 25
#endif

#ifndef FACTORY_TANK_RIEG_TIME
#define FACTORY_TANK_RIEG_TIME 15
#endif

#ifndef FACTORY_VMOT_OPER_TIME
#define FACTORY_VMOT_OPER_TIME 9
#endif

#ifndef FACTORY_VMOT_OPEN_TIME50
#define FACTORY_VMOT_OPEN_TIME50 5
#endif

#ifndef FACTORY_VMOT_OPEN_TIME25
#define FACTORY_VMOT_OPEN_TIME25 3
#endif

#ifndef FACTORY_PUMP_HOST
#define FACTORY_PUMP_HOST "192.168.10.193"
#endif

#define DEFAULT_STATE false

class TankSettings {
 public:
  uint16_t level_min;
  uint16_t level_max;
  uint8_t  rieg_time;      // Tiempo de riego en minutos.
  uint8_t  vs_toper;       // Tiempo total de operación de valvula motorizada en segundos.
  uint8_t  vs_topen50;     // Tiempo de apertura de valvula motorizada al 50% (Tomado desde la posicion cerrada)
  uint8_t  vs_topen25;     // Tiempo de apertura de valvula motorizada al 25% (Tomado desde la posicion cerrada)
  bool    hls_Inverted;    // Bandera de contacto de switch de nivel alto invertido ( Para adaptar posicion del Flotador )
  String  pump_host;       // Direccion IP del Controlador de Bomba Asociado.
  bool    manual_mv01;     // Permitir que se pueda abrir válvula MV01 de forma manual
    
  static void read(TankSettings& settings, JsonObject& root) {
    root["level_min"] = settings.level_min;
    root["level_max"] = settings.level_max;
    root["rieg_time"] = settings.rieg_time;
    root["vs_toper"]  = settings.vs_toper;
    root["vs_topen50"] = settings.vs_topen50;  // Para recircular inicialmente.
    root["vs_topen25"] = settings.vs_topen25;  // Para recircular con poca contribucion del tanque.
    root["hls_invert"] = settings.hls_Inverted;
    root["pump_host"]  = settings.pump_host;
    root["manual_mv01"] = settings.manual_mv01;
  }

  static StateUpdateResult update(JsonObject& root, TankSettings& settings) {
    settings.level_min = root["level_min"] | FACTORY_TANK_MIN_LEVEL;
    settings.level_max = root["level_max"] | FACTORY_TANK_MAX_LEVEL;
    settings.rieg_time = root["rieg_time"] | FACTORY_TANK_RIEG_TIME;
    settings.vs_toper  = root["vs_toper"]  | FACTORY_VMOT_OPER_TIME;
    settings.vs_topen50 = root["vs_topen50"] | FACTORY_VMOT_OPEN_TIME50;
    settings.vs_topen25 = root["vs_topen25"] | FACTORY_VMOT_OPEN_TIME25;
    settings.hls_Inverted = root["hls_invert"] | DEFAULT_STATE;
    settings.pump_host = root["pump_host"] | FACTORY_PUMP_HOST;
    settings.manual_mv01 = root["manual_mv01"] | false;
    return StateUpdateResult::CHANGED;
  }
  
};

class TankSettingsService : public StatefulService<TankSettings> {
 public:
   TankSettingsService(AsyncWebServer* server, FS* fs, SecurityManager* securityManager);
   void begin();
   uint8_t readMax();
   uint8_t readMin();
   uint8_t readRiegTime();
   uint8_t readVSOperTime();
   uint8_t readVSOpenTime50();
   uint8_t readVSOpenTime25();
   bool    readHLS_InvFlag();
   String  readPumpHost();
   bool    readManualMv01();
   

 private:
  HttpEndpoint<TankSettings> _httpEndpoint;
  FSPersistence<TankSettings> _fsPersistence;
};

#endif  // end TankSettingsService_h
