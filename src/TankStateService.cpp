#include <TankStateService.h>
// Constructor de Clase:
TankStateService::TankStateService(AsyncWebServer* server,
                                   SecurityManager* securityManager,
                                   AsyncMqttClient* mqttClient,
                                   TankMqttSettingsService* tankMqttSettingsService) :
    _restartSrv( server, securityManager),
    _mqttPubSub(TankState::haRead, TankState::haUpdate, this, mqttClient),
    _webSocket(TankState::read,
               TankState::update,
               this,
               server,
               TANK_SETTINGS_SOCKET_PATH,
               securityManager,
               AuthenticationPredicates::IS_AUTHENTICATED),
    _httpEndpoint(TankState::read,
                  TankState::update,
                  this,
                  server,
                  TANK_SETTINGS_ENDPOINT_PATH,
                  securityManager,
                  AuthenticationPredicates::NONE_REQUIRED),
    _mqttClient(mqttClient),
    _tankMqttSettingsService(tankMqttSettingsService) {

        // configure MQTT callback
        _mqttClient->onConnect(std::bind(&TankStateService::registerConfig, this));
        
        // configure update handler for when a tank settings change
        _tankMqttSettingsService->addUpdateHandler([&](const String& originId) { registerConfig(); }, false);

        // manejador para actualizar salidas de control via MQTT:
        addUpdateHandler([&](const String& originId) { onOutputsUpdated(); }, false);
    }   

// Inicialización del Servicio:
void TankStateService::begin() {
// Configuración de pines de conexionado:
#ifdef ESP32
   _pinSOV1     = 12;  // Valvula Solenoide de Llenado.
   _pinSOV2     = 13;  // Valvula solenoide de Riego de Jardín.
   _pinHLS      = 4;   // Sensor de Alto nivel
   _pinMV01_CCW = 19;  // Salida de control de Valvula Motorizada. ( controla el rele DPDT)
   _pinMV01_SW_CLOSE = 10; // Limitswitch de posicion Cerrada.
   _pinMV01_SW_OPEN  = 6;  // Limitswitch de posicion Abierta. (No tiene pullup interno)
   _pinMV01_ON  = 18;      // Control de Encendido y apagado del motor de la valvula.
#elif defined(ESP32)
   _pinSOV1     =  5;  // Valvula Solenoide de Llenado.
   _pinSOV2     = 18;  // Valvula solenoide de Riego de Jardín.
   _pinHLS      = 36;  // Sensor de Alto nivel
   _pinMV01_CCW = 23;  // Salida de control de Valvula Motorizada. ( controla el rele DPDT)
   _pinMV01_SW_CLOSE = 35;  // Limitswitch de posicion Cerrada.
   _pinMV01_SW_OPEN  = 34;  // Limitswitch de posicion Abierta. (No tiene pullup interno)
   _pinMV01_ON  = 19;       // Control de Encendido y apagado del motor de la valvula.   
#elif defined(ESP8266)
   _pinSOV1 =  4;      // Valvula Solenoide de Llenado.
   _pinHLS  = 14;      // Sensor de Alto nivel
#endif 
  // Garantizar que las salidas de control se vayan al estado de "apagado"
  digitalWrite(_pinSOV1, LOW);
  // Programar Salidas Discretas:
  pinMode(_pinSOV1, OUTPUT);

#if defined(ESP32)  
  digitalWrite(_pinSOV2, LOW);
  digitalWrite(_pinMV01_CCW, LOW); // Cerrar valvula motorizada de Servicio.
  digitalWrite(_pinMV01_ON, LOW); // Mantener detenido el motor.
  pinMode(_pinMV01_CCW, OUTPUT);
  pinMode(_pinMV01_ON, OUTPUT);
  pinMode(_pinSOV2, OUTPUT);
#endif

  // Enrtradas Discretas:
  pinMode(_pinHLS, INPUT);
  
#if defined(ESP32)  
  pinMode(_pinMV01_SW_CLOSE, INPUT_PULLUP);
  pinMode(_pinMV01_SW_OPEN,  INPUT_PULLUP);
#endif

  // Valores iniciales:
  _state.cmdfill   = DEFAULT_STATE;
  _state.cmdsrv    = DEFAULT_STATE;
  _state.sov1On    = DEFAULT_STATE; // Valvula solenoide de Llenado.
  _state.sov2On    = DEFAULT_STATE; // Valvula solenoide de Riego.
  _state.Level     = 255;
  _state.tkstate   = TS_IDLE;
  _state.vsState   = VS_INIT;
  _state.recIndex  = 0;
  _state.time_vsoper = 0;
  _state.pump_online = false;
  _state.pump_running = false;
  _state.pump_fail = false;
  _state.dataupdate = false;
  onOutputsUpdated();
}

// Actualizar puertos de salida discretos:
void TankStateService::onOutputsUpdated() {
  Serial.println("Actualizando salidas de control...");
  digitalWrite(_pinSOV1, _state.sov1On ? OUT_ON : OUT_OFF);
  digitalWrite(_pinSOV2, _state.sov2On ? OUT_ON : OUT_OFF);
#if defined(ESP32)  
  digitalWrite(_pinMV01_CCW, _state.vsCmnd ? OUT_ON : OUT_OFF);
  digitalWrite(_pinMV01_ON, _state.vsMotOn ? OUT_ON : OUT_OFF);
#endif  
  if(_state.cmdRst)
     _restartSrv.restartNow();
  
}

// Establecer configuración MQTT del dispositivo, una vez que el cliente se conecte al broker:
void TankStateService::registerConfig() {
  if (!_mqttClient->connected()) {
    return;
  }

  String configTopic;
  String subTopic;
  String pubTopic;

  DynamicJsonDocument doc(256);
  _tankMqttSettingsService->read([&](TankMqttSettings& settings) {
    configTopic = settings.mqttPath + "/config";
    subTopic = settings.mqttPath + "/set";
    pubTopic = settings.mqttPath + "/state";
    doc["~"] = settings.mqttPath;
    doc["name"] = settings.name;
    doc["unique_id"] = settings.uniqueId;
  });
  doc["cmd_t"] = "~/set";
  doc["stat_t"] = "~/state";
  doc["schema"] = "json";
  doc["IPAddress"] = WiFi.localIP().toString();
  String payload;
  serializeJson(doc, payload);
  _mqttClient->publish(configTopic.c_str(), 0, false, payload.c_str());
  _mqttPubSub.configureTopics(pubTopic, subTopic);
}

// Leer indice de recirculacion actual.
uint8_t TankStateService::readRecIndex(){
  return _state.recIndex;
}

// Leer comando de servicio actual.
bool TankStateService::readCmdServ(){
  return _state.cmdsrv;
}

/* / Ejemplo de como actualizar data MQTT desde el dispositivo usando MQTT publish:
void TankStateService::updateMqttData() {
  DynamicJsonDocument doc(256);
  String pubTopic;
  String payload;
  
  _tankMqttSettingsService->read([&](TankMqttSettings& settings) {
    pubTopic = settings.mqttPath + "/state";
  });

  Serial.println("Enviando JSON MQTT Publish...");
  doc["sov1_on"]  = _state.sov1On ? ON_STATE : OFF_STATE;
  doc["sov2_on"]  = _state.sov2On ? ON_STATE : OFF_STATE;
  doc["hl_on"]    = _state.swhlvlOn ? ON_STATE : OFF_STATE;
  doc["level"]    = _state.Level;
  doc["cmd_fill"] = _state.cmdfill ? ON_STATE : OFF_STATE;
  doc["cmd_serv"] = _state.cmdsrv  ? ON_STATE : OFF_STATE;
  doc["state"]    = _state.state;
 
  serializeJson(doc, payload);
  _mqttClient->publish(pubTopic.c_str(), 0, false, payload.c_str());
}
*/