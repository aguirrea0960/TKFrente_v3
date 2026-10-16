#ifndef TankStateService_h
#define TankStateService_h

#include <TankMqttSettingsService.h>
#include <HttpEndpoint.h>
#include <MqttPubSub.h>
#include <WebSocketTxRx.h>
#include <RestartService.h>

#define DEFAULT_STATE false
#define OFF_STATE "OFF"
#define ON_STATE "ON"

// Estados de funcionamiento del tanque:
#define TS_EMPTY    0
#define TS_IDLE     1
#define TS_FILL     2
#define TS_SERV     3
#define TS_FULL     4
#define TS_REC_50   6   // Recirculacion al 50% de apertura en valvula de servicio. (Abriando valvula desde cero.)
#define TS_REC_25   7   // Recirculacion al 25% de apertura en valvula de servicio. (Abriendo valvula desde cero)
#define TS_REC_50C  8   // Recirculacion al 50% de apertura en valvula de servicio cerrando.
#define TS_REC_25C  9   // Recirculacion al 25% de apertura en valvula de servicio.


// Estado de operación de valvula de servicio:
#define VS_MOVING   0   // Espera de confirmación de Acción. (Abriendo/Cerrando)
#define VS_OPEN     1   // Valvula Abierta
#define VS_CLOSED   2   // Valvula Cerrada
#define VS_INIT     3   // Estado inicial (Indeterminado).
#define VS_RECIRC   4   // Estado de recirculación (valvula parcialmente abierta/cerrada)

// Estados de procesamiento de Riego de Jardin:
#define RG_IDLE    0    // Estado de espera.. 
#define RG_LOAD    1    // Carga de tiempo maximo de Riego que ha sido configurado.
#define RG_DELAY   2    // Retardo de tiempo para regar.
#define RG_STOP    3    // Detener Riego.

// Note that the built-in LED is on when the pin is low on most NodeMCU boards.
// This is because the anode is tied to VCC and the cathode to the GPIO 4 (Arduino pin 2).
#ifdef ESP32
  #define OUT_ON  0x1
  #define OUT_OFF 0x0
#elif defined(ESP8266)
  #define OUT_ON  0x1
  #define OUT_OFF 0x0
#endif

#define TANK_SETTINGS_ENDPOINT_PATH "/rest/devState"
#define TANK_SETTINGS_SOCKET_PATH "/ws/devState"

#if defined(ESP8266)
  #define SS_RX           12   // Pin de Rx del puerto serial para sensor de nivel.
  #define SS_TX           13   // Pin de Tx del puerto serial para sensor de nivel.
#else
  #define SS_RX            1   // Pin de Rx del puerto serial para sensor de nivel.
  #define SS_TX            0   // Pin de Tx del puerto serial para sensor de nivel.
#endif

// Clase estados del tanque:
class TankState {
 public:
    bool    sov1On = false;   // Estado de valvula solenoide de llenado.
    bool    sov2On = false;   // Estado de valvula solenoide de Riego.
    bool    swhlvlOn;    // Estado de sensor de alto nivel de agua. (Discreto)
    bool    vslsOpen;    // Estado de limitswitch válvula de servicio abierta.
    bool    vslsClosed;  // Estado de limitswitch válvula de servicio cerrada.
    double  Level;       // Nivel de agua porcentual dado por sensor ultrasónico via puerto RS232/RS485.
    bool    cmdfill;     // Comando de llenado de tanque.
    bool    cmdsrv;      // Comando de servicio de tanque.
    bool    cmdrieg;     // Comando de Riego.
    bool    fillena;     // Permisivo de llenado.
    bool    servena;     // Permisivo de servicio.
    bool    vsMotOn;     // Control de endcendido de motor de valvula.
    bool    cmdRec50;    // Comando para recircular al 50% de apertura ( la valvula debe estar cerrada previamente)
    bool    cmdRec25;    // Comando para recircular al 25% de apertura ( la valvula debe estar cerrada previamente)
    bool    vsCmnd;      // Comando para valvula de Servicio (Motorizada)
    bool    cmdRst;      // Comando MQTT de Reset Remoto.
    bool    dataupdate;  // Bandera de actualizacion de data.
    uint8_t tkstate;     // Estado de funcionamiento del tanque.
    uint8_t levelstate;  // Estado de sensores de Nivel
    uint8_t vsState;     // Estado de valvula de servicio. (Motorizada)
    uint16_t time_rem;   // Tiempo restante de riego en segundos.
    uint8_t time_vsoper; // Tiempo de operacion de valvula motoriada abriendo o cerrando.
    uint8_t recIndex;    // Indice de recirculación.

    // Supervisión y enclavamiento de Bomba de Llenado:
    bool    pump_online = false;   // Bomba responde por red (Online)
    bool    pump_running = false;  // Bomba en marcha confirmada (PS_ON_NO_WF)
    bool    pump_fail = false;     // Bomba en falla de agua (PS_OFF_WF)

  // Actualizar data de estados hacia HTTP o WS:
  static void read(TankState& actualstate, JsonObject& root) {
    // Actualizar datos desde el ESP32/ESP8266:   
    onIOUpdated(actualstate);
    //Serial.println("Enviando JSON hacia WS o REST...");
    root["sov1_on"]      = actualstate.sov1On;
    root["sov2_on"]      = actualstate.sov2On;
    root["hl_on"]        = actualstate.swhlvlOn;
    root["level"]        = actualstate.Level;
    root["cmd_fill"]     = actualstate.cmdfill;
    root["cmd_serv"]     = actualstate.cmdsrv;
    root["cmd_rieg"]     = actualstate.cmdrieg;
    root["cmd_rec50"]    = actualstate.cmdRec50;
    root["cmd_rec25"]    = actualstate.cmdRec25;
    root["state"]        = actualstate.tkstate;
    root["vs_state"]     = actualstate.vsState;
    root["time_rem"]     = actualstate.time_rem;
    root["time_vsoper"]  = actualstate.time_vsoper;
    root["pump_online"]  = actualstate.pump_online;
    root["pump_running"] = actualstate.pump_running;
    root["pump_fail"]    = actualstate.pump_fail;
  }

  // Validar valores de comandos actuales vs los que se parsean:
  static bool CheckValues(uint8_t cmdIdx, TankState& tkstate, bool value){
    switch(cmdIdx){
       case 0:
         // Estado de comando de servicio: 
         if (tkstate.cmdfill != value) {
             tkstate.cmdfill = value;
             tkstate.dataupdate = true;
             return true;
         }
       break;
       case 1:
         // Estado de comando de servicio: 
         if (tkstate.cmdsrv != value) {
             tkstate.cmdsrv = value;
             tkstate.dataupdate = true;
             return true;
         }
       break;
       case 2:
          // Estado de comando de Riego:
          if (tkstate.cmdrieg != value) {
              tkstate.cmdrieg = value;
              tkstate.dataupdate = true;
              return true;
          }
       break;
       case 3:
          // Comando de Recirculacion al 50%
          if (tkstate.cmdRec50 != value) {
              tkstate.cmdRec50 = value;
              tkstate.dataupdate = true;
              return true;
          }
       break;
       case 4:
          // Comando de Recirculacion al 25%
          if (tkstate.cmdRec25!= value) {
              tkstate.cmdRec25 = value;
              tkstate.dataupdate = true;
              return true;
          }
       break;
       case 5:
         // Comando de reset remoto: 
          if (tkstate.cmdRst != value) {
              tkstate.cmdRst = value;
              return true;
          }
       break;
    }
    return false;
  }

  // Los estados a actualizar por aca solo los comandos provenientes desde HTTP o WS.
  static StateUpdateResult update(JsonObject& root, TankState& tkstate) {
    StateUpdateResult resp = StateUpdateResult::UNCHANGED;
    //Serial.println("Leyendo JSON desde WS o REST...");
    
    boolean newState = root["cmd_fill"] | DEFAULT_STATE;
    if (CheckValues(0, tkstate, newState))
        return StateUpdateResult::CHANGED;
  
    newState = root["cmd_serv"] | DEFAULT_STATE;
    if (CheckValues(1, tkstate, newState))
        return StateUpdateResult::CHANGED;
    
    newState = root["cmd_rieg"] | DEFAULT_STATE;
    if (CheckValues(2, tkstate, newState))
        return StateUpdateResult::CHANGED;

    newState = root["cmd_rec50"] | DEFAULT_STATE;
    if (CheckValues(3, tkstate, newState))
        return StateUpdateResult::CHANGED;

    newState = root["cmd_rec25"] | DEFAULT_STATE;
    if (CheckValues(4, tkstate, newState))
        return StateUpdateResult::CHANGED;

    return resp;
  }

  // Actualizar data de estado hacia el broker MQTT:
  static void haRead(TankState& actualstate, JsonObject& root) {
  char levelStr[8] ="\0";
    
    sprintf(levelStr,"%5.2f",actualstate.Level);
    //Serial.println("Enviando JSON MQTT...");
    // Actualizar datos desde el ESP32/ESP8266:   
    onIOUpdated(actualstate);
    root["sov1_on"]  = actualstate.sov1On ? ON_STATE : OFF_STATE;
    root["sov2_on"]  = actualstate.sov2On ? ON_STATE : OFF_STATE;
    root["hl_on"]    = !actualstate.swhlvlOn ? ON_STATE : OFF_STATE;
    root["level"]    = levelStr;
    root["cmd_fill"] = actualstate.cmdfill ? ON_STATE : OFF_STATE;
    root["cmd_serv"] = actualstate.cmdsrv  ? ON_STATE : OFF_STATE;
    root["cmd_rieg"] = actualstate.cmdrieg ? ON_STATE : OFF_STATE;
    root["cmd_rec50"]= actualstate.cmdRec50? ON_STATE : OFF_STATE;
    root["cmd_rec25"]= actualstate.cmdRec25? ON_STATE : OFF_STATE;
    root["state"]    = actualstate.tkstate;
    root["vs_state"] = actualstate.vsState;
    root["time_rem"] = actualstate.time_rem;
    root["time_vsoper"] = actualstate.time_vsoper;
  }

  // Actualizar data de estado desde Broker MQTT:
  static StateUpdateResult haUpdate(JsonObject& root, TankState& tkstate) {
    StateUpdateResult resp = StateUpdateResult::UNCHANGED;
    boolean newState = false;
    //Serial.println("Leyendo JSON MQTT...");
    
    // parse new Fill state 
    String state = root["cmd_fill"];
    if (state !=""){
      newState = state.equals(ON_STATE);   // Activar llenado?
      if (CheckValues(0, tkstate, newState))
        return StateUpdateResult::CHANGED;
    }
    
    String state2 = root["cmd_serv"];
    if (state2 !=""){
      newState = state2.equals(ON_STATE);
      if (CheckValues(1, tkstate, newState))
        return StateUpdateResult::CHANGED;
    }

    // Comando remoto de riego?
    String state3 = root["cmd_rieg"];
    if (state3 !=""){
      newState = state3.equals(ON_STATE);
      // Regar jardin? : Debe estar abierta la valvula de servicio.
      if (CheckValues(2, tkstate, newState))
        return StateUpdateResult::CHANGED;
    }
    
    // Comando remoto de recirculación al 25% de apertura de valvula de servicio?
    String state4 = root["cmd_rec25"];
    // parse new Service state 
    if (state4 !=""){
      newState = state4.equals(ON_STATE);
      if (CheckValues(3, tkstate, newState))
        return StateUpdateResult::CHANGED;  
    }
    
    // Comando remoto de recirculación al 50% de apertura de valvula de servicio?
    String state5 = root["cmd_rec50"];
    // parse new Service state 
    if (state5 !=""){
      newState = state5.equals(ON_STATE);
      if (CheckValues(4, tkstate, newState))
        return StateUpdateResult::CHANGED;  
    }
    
    // Reset remoto?
    String state6 = root["cmd_rst"];
    //  Serial.printf("state: %s\r\n");
    if (state6 !=""){
      newState = state6.equals(ON_STATE);   // Reset remoto del controlador?
      if (CheckValues(5, tkstate, newState))
        return StateUpdateResult::CHANGED;
    } 
    return resp;
  }

  
  // Actualizar estados del tanque:
  static void onIOUpdated(TankState& _state){
    
    // Comando de Riego de Jardin:
    // --------------------------------------------------------
    // Valvula de Servicio esta abierta: Regar Jardin?
    if(_state.cmdrieg)
       _state.sov2On = true;   // Abrir válvula.
    else
       _state.sov2On = false;  // Cancelar riego.     
   
    // --------------------------------------------------------
    // Estado funcional de sensores discretos de nivel de agua:
    switch(_state.levelstate){
      // Tanque esta lleno (Sensor HLS activo / validado):
      case 0:
        if(_state.tkstate != TS_SERV && _state.tkstate != TS_REC_25 && _state.tkstate != TS_REC_50)
           _state.tkstate  = TS_FULL;   // Tanque Lleno. (si no estamos sirviendo agua)
        _state.fillena = false;         // No podemos ejecutar comando de llenado.
        _state.servena = true;          // Si podemos servir agua.
        _state.sov1On  = false;         // Desenergizar valvula de llenado (evitar desborde)
        _state.cmdfill = false;         // cancelar comando de llenado (si estabamos llenando). 
        // Si estamos recirculando, cancelar el que este activo.
        if(_state.cmdRec25){
           _state.cmdRec25 = false;
           _state.recIndex = 1;
        }
        else if(_state.cmdRec50){
           _state.cmdRec50 = false;
           _state.recIndex = 2;
        }   
      break;
      
      // Tanque disponible (no lleno): puede servir o llenarse.
      default:
        // Si estamos en alguna de las funciones de servicio o llenado, no cambiar estado actual.
        if(_state.tkstate != TS_FILL && _state.tkstate != TS_SERV && 
           _state.tkstate != TS_REC_25 && _state.tkstate != TS_REC_50)
           _state.tkstate = TS_IDLE; // Tanque Disponible (en espera)
        
        // Enclavamiento duro: Solo permitir llenar si la bomba está ONLINE en la red
        _state.fillena = _state.pump_online; 
        _state.servena = true;    // Si podemos servir agua si la bomba está disponible.
      break;
    }  
  
    // Si la bomba no está online, abortar cualquier comando o intento de llenado
    if (!_state.pump_online) {
      _state.fillena = false;
      if (_state.cmdfill || _state.sov1On) {
        _state.cmdfill = false;
        _state.sov1On  = false;
        if (_state.tkstate == TS_FILL) _state.tkstate = TS_IDLE;
      }
    }

    // Estado de procesamiento del tanque:
    switch(_state.tkstate){
      // Tanque vacio: Solo podemos llenarlo de agua
      case TS_EMPTY:
        // Llenar tanque?
        if(_state.fillena && _state.cmdfill){
          _state.sov1On  = true;    // Abrir válvula.
          _state.tkstate = TS_FILL; // Cambiar a estado de llenar.
        }
        else
          _state.sov1On  = false;
      break;
      
      // Tanque llenandose:
      case TS_FILL:
        // Si ya esta lleno (Contacto cerrado), o bomba offline, o se cancelo comando:
        if(!_state.swhlvlOn || !_state.cmdfill || !_state.pump_online){
          _state.sov1On  = false;
          _state.cmdfill = false;
          // Si no estamos sirviendo de forma simultánea, colocar tanque en modo de espera.
          if(!_state.cmdsrv )
            _state.tkstate = TS_IDLE;
          else {
            _state.tkstate = TS_SERV;  // Estamos sirviendo tambien, luego de finalizar el servicio. 
            break;
          }  
        }
        // Servir Agua?: (Abrir valvula motorizada)
        if(_state.cmdsrv && _state.servena){ 
          _state.vsCmnd  = true;
          _state.vsMotOn = true;  // Activar motor.
        }
        else {
          _state.vsCmnd  = false; // Cerrar valvula motorizada de servicio.
          _state.vsMotOn = true;  // Activar motor.
        }  
      break;
      
      // Recirculando a 50% del caudal:
      case TS_REC_50:
        if(!_state.cmdRec50){
          _state.recIndex = 4;
          _state.vsCmnd   = false;  // Cerrar valvula de servicio.
          _state.vsMotOn  = true;
          _state.sov1On   = false;  // Desacoplar SOV1 de salida de recirculación
          _state.cmdfill  = false;
          _state.tkstate  = TS_IDLE;
          break;
        }
        // Recircular al 25%? (Colocar valvula al 25% de apertura partiendo desde el 50%)
        if(_state.cmdRec25){
          _state.cmdRec50 = false;
          _state.tkstate  = TS_REC_25;
          _state.recIndex = 5;
          _state.vsCmnd   = false; // Cerrar valvula de servicio hasta 25%.
          _state.vsMotOn  = true;
        }
      break;  
      
      // Recirculando a 25% del caudal:
      case TS_REC_25:
        if(!_state.cmdRec25){
          _state.recIndex = 3;
          _state.vsCmnd   = false;  // Cerrar valvula.
          _state.vsMotOn  = true;
          _state.sov1On   = false;  // Desacoplar SOV1 de salida de recirculación
          _state.cmdfill  = false;
          _state.tkstate  = TS_IDLE;
          break;
        }

        // Recircular al 50%? (Abriendo mas la valvula...)  
        if(_state.cmdRec50){
          _state.cmdRec25 = false;
          _state.tkstate  = TS_REC_50;
          _state.recIndex = 6;
          _state.vsCmnd   = true;  // Continuar abriendo el tiempo faltante.
          _state.vsMotOn  = true;
        }
      break;  
      
      // Tanque en servicio y recirculando:
      case TS_SERV:
        // Si se cancela servicio desde la interfaz:
        if(!_state.cmdsrv){
          _state.cmdsrv   = false;
          _state.vsCmnd   = false; // CERRAR MV01
          _state.vsMotOn  = true;
          
          if(!_state.cmdfill)
            _state.tkstate = TS_IDLE;
          else {
            _state.tkstate = TS_FILL; 
          }  
          break;
        }

        // Llenando tanque? (OJO: Monitorear el estado de sensor de alto nivel aqui en esta fase,
        // ya que estamos sirviendo y es el estado principal por lo tanto, el de llenado es secundario!)
        if(_state.cmdfill && _state.fillena && _state.swhlvlOn){
          _state.sov1On  = true;
        }
        else
          _state.sov1On  = false;
      break;

      // Tanque en espera de instrucciones: (DISPONIBLE)
      case TS_IDLE:
        // Recircular al 50%?   
        if(_state.cmdRec50 && _state.servena){
          _state.tkstate  = TS_REC_50;
          _state.recIndex = 2;
          _state.vsCmnd   = true;  // Abrir valvula de servicio.
          _state.vsMotOn  = true;
          _state.cmdfill  = true;
          _state.sov1On   = true;
          break;
        }
        
        // Recircular al 25%?   
        if(_state.cmdRec25 && _state.servena){
          _state.tkstate  = TS_REC_25;
          _state.recIndex = 1;
          _state.vsCmnd   = true; // Abrir valvula de servicio.
          _state.vsMotOn  = true;
          _state.cmdfill  = true;
          _state.sov1On   = true;
          break;
        }
        
        // Servir Agua?: (Abrir valvula motorizada)
        if(_state.cmdsrv && _state.servena){ 
          _state.recIndex = 0;
          _state.vsCmnd   = true;
          _state.vsMotOn  = true;
          _state.tkstate  = TS_SERV;
          break;
        }
        
        // Llenar tanque?
        if(_state.cmdfill && _state.fillena){
           _state.sov1On  = true;
           _state.tkstate = TS_FILL;
        }
      break;
      
      // Tanque LLeno: Solo podemos servir agua. Cancelar comando de Llenado!.
      case TS_FULL:
        // Servir Agua o Recircular?
        if(_state.cmdsrv && _state.servena){ 
          _state.vsCmnd  = true;
          _state.vsMotOn = true;
          _state.tkstate = TS_SERV;
          _state.recIndex = 0;
          break;
        }
        // Recircular al 50%?   
        if(_state.cmdRec50 && _state.servena){
          _state.vsCmnd  = true;
          _state.vsMotOn = true;
          _state.tkstate  = TS_REC_50;
          _state.recIndex = 2;
          break;
        }
        // Recircular al 25%?   
        if(_state.cmdRec25 && _state.servena){
          _state.tkstate  = TS_REC_25;
          _state.recIndex = 1;
          _state.vsCmnd  = true;
          _state.vsMotOn = true;
        }
      break;
    }
  }
}; // TankState

// Clase para manejo del Servicio del Tanque:
class TankStateService : public StatefulService<TankState> {
 public:
    TankStateService(AsyncWebServer* server,
                    SecurityManager* securityManager,
                    AsyncMqttClient* mqttClient,
                    TankMqttSettingsService* tankMqttSettingsService);
    void begin();
    uint8_t readRecIndex();
    bool    readCmdServ();
         
    // Pines de conexionado de sensores discretos y salidas de control. 
    int  _pinSOV1;          // Salida de control de valvula solenoide de Llenado. 
    int  _pinSOV2;          // Salida de control de valvula solenoide de Riego.  
    int  _pinMV01_CCW;      // Comando de Apertura (Activo en '1') 
    int  _pinHLS;           // Entrada de sensor de alto nivel.
    int  _pinMV01_SW_OPEN;  // Entrada de limitswitch de posición Abierta.
    int  _pinMV01_SW_CLOSE; // Entrada de limitswitch de posición Cerrada.
    int  _pinMV01_ON;       // Salida de control de encendido de motor de valvula.
 private:
    RestartService _restartSrv;
    MqttPubSub<TankState> _mqttPubSub;
    WebSocketTxRx<TankState> _webSocket;
    HttpEndpoint<TankState> _httpEndpoint;
  
    // Manejo de Conexiones y Servicio MQTT:
    AsyncMqttClient* _mqttClient;
    TankMqttSettingsService* _tankMqttSettingsService;
    
    void registerConfig();
    void onOutputsUpdated();
   
};

#endif
