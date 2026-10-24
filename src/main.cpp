#include <ESP8266React.h>
#ifdef ESP32
  #include <nvs_flash.h>
#endif
#include <TankMqttSettingsService.h>
#include <TankStateService.h>
#include <TankSettingsService.h>
// SoftwareSerial is only needed on ESP8266
#ifndef ESP32
  #include <SoftwareSerial.h>
#endif

#ifdef ESP32
  #include <HTTPClient.h>
  #include <WiFiClient.h>
#else
  #include <ESP8266HTTPClient.h>
  #include <WiFiClient.h>
#endif

#undef  ARDUHAL_LOG_LEVEL
#define ARDUHAL_LOG_LEVEL (-1)

#define SERIAL_BAUD_RATE 115200
#define SENSOR_BAUD_RATE 9600
#define SENSOR_HLD_VALID_TIME 50  // 5 Segundos en ticks de 100mS para indicar alto nivel validado.

/*/ Estados de procesamiento de medicion de Nivel Ultrasónico,
#define SS_CMD 0    // Enviar comando a sensor.
#define SS_READ 1   // Leer valor de medicion de Distancia.
#define SS_CALC 2   // Calcular Distancia hasta nivel del Agua del Tanque.
#define SS_LEVEL 3  // Calcular el nivel % de altura de agua.
#define SS_REST 4   // Tiempo de descanso...
*/
// Estados de procesamiento de medicion de Nivel Ultrasónico:
#define SS_CMD   0  // Enviar comando a sensor.
#define SS_READ  1  // Leer valor de medicion de Distancia.
#define SS_CALC  2  // Calcular Distancia hasta nivel del Agua del Tanque.
#define SS_LEVEL 3  // Calcular el nivel % de altura de agua.
#define SS_REST  4  // Tiempo de descanso...

#define BINARY_DATA 1

#define MAX_BUFFER_SIZE   16  // maximo de bytes en buffer.

AsyncWebServer server(80);

ESP8266React esp8266React(&server);

TankMqttSettingsService tankMqttSettingsService =
    TankMqttSettingsService(&server, esp8266React.getFS(), esp8266React.getSecurityManager());

TankStateService tankStateService = TankStateService(&server,
                                                     esp8266React.getSecurityManager(),
                                                     esp8266React.getMqttClient(),
                                                     &tankMqttSettingsService);

TankSettingsService tankSettingsService =
    TankSettingsService(&server, esp8266React.getFS(), esp8266React.getSecurityManager());

 
#if defined(ESP32)
   #define sensor Serial1  // Usar puerto de Hardware.
#else
   SoftwareSerial sensor(SS_RX, SS_TX);   
#endif

/*********************************************************************************************************************************\
 * HC-SR04, HC-SR04+, AJ-SR04M - Ultrasonic distance sensor
 *
 * Lbreria especial con fines de medicion de nivel: (Alfonso Aguirre 01/2022)
 * Hay 2 parametros hasta ahora:
 * 1) Distancia de nivel minimo (0%)  : Distancia medida hasta el nivel critico dado en centimetros.
 * 2) Distancia de nivel maximo (100%): Distancia medida hasta el nivel maximo de liquido en centimetros.
 * Referencia de Mediciones:
 *                 _
 *                | |    <-------Sensor ultrasónico AJ-SR04: Ubicado preferiblemente a una distancia prudente de 20cms
 *                /_\            al nivel maximo de agua medible.
 * _______                   ________
 *        |  -------------  | <- MaxLevel: Distancia en cms de nivel maximo.( No menos de MIN_SENSOR_DISTANCE )
 *        |                 |
 *        |                 |
 *        |                 |
 *        |                 |
 *        |                 |
 *        |  -------------  | <- MinLevel: Distancia cmd de nivel mínimo. ( No mas de SR04_MAX_SENSOR_DISTANCE )
 *        |                 |
 *        |_________________|
 *
 * - TANQUE CON FUNCION ADICIONAL DE CONTROL RIEGO DE JARDIN ( O UN COMANDO ESPECIAL )
\*********************************************************************************************************************************/

// Variables del main:
uint32_t Timer = 0;
uint8_t  levelState = TS_IDLE;
uint8_t  count = 0;
uint8_t  lastCmdState = 0;
uint8_t  vslsState = 0;

bool    laststate_hls = true;  // En caso de Reset, asumir que no hay alto nivel en el tanque.
bool    laststate_vsOpen;
bool    laststate_vsClosed;
bool    dataUpdated;
bool    lastCmdRieg;

// Supervisión de Bomba de Llenado:
bool isPumpOnline = false;
bool isPumpRunning = false;
bool isPumpFail = false;
uint32_t lastPumpPollTime = 0;
const uint32_t PUMP_POLL_INTERVAL_MS = 3000; // Sondeo cada 3 segundos

// Watchdog de seguridad de llenado continuo (40 minutos en ticks de 100ms):
uint32_t fillWatchdogTicks = 0;
const uint32_t FILL_MAX_TICKS = 24000; // 40 min * 60 s * 10 ticks/s

// Estados para la gestión de arranque de bomba al servir agua en Lazo Cerrado:
enum ServicePumpStep {
  SP_IDLE = 0,
  SP_WAIT_VALVE_OPEN, // Esperando que MV01 esté 100% abierta (vslsState == VS_OPEN)
  SP_STABILIZING,     // 2 segundos (20 ticks de 100ms) de reposo para inundar la succión
  SP_PULSING_RESET,   // 2 segundos (20 ticks de 100ms) de pulso de Reset
  SP_VERIFYING_RUN,   // Hasta 30 segundos (300 ticks de 100ms) esperando marcha confirmada
  SP_RUNNING,         // Bomba en marcha confirmada (supervisión continua)
  SP_FAIL_ABORT       // Falla o timeout -> Cerrar MV01 y abortar
};

ServicePumpStep servicePumpStep = SP_IDLE;
uint16_t serviceTimer = 0;
uint8_t resetPulseTimer = 0;

// variables asociadas al Sensor de Distancia:
uint8_t  SenState = SS_CMD;
uint8_t  RxIdx = 0;               // Indice de recepcion serial.
char     LBuff[MAX_BUFFER_SIZE];      // Buffer de recepcion serial para mediciones de distancia.
uint32_t lastCharTime;
const uint32_t eotTimeoutMs = 5;  // IdleTime de 5 ms, durante recepcion via serial.
String   DisStr = "";
bool     sensorOK = false;
bool     vsmotorOn;
uint8_t  MinLevel = 147, MaxLevel = 27;
uint16_t distance;
uint8_t  RestTime = 0;
double   distCalc;
uint8_t  hlTime = 0;       // Tiempo para validar sensor de alto nivel en ticks de 100mS.
uint8_t  riegoCount = 0;   // Contador de minutos restantes de riego..
uint8_t  vsTimeSegFin = 0;
uint8_t  vsInitTime = 10;  // Retardo de 1 segundo para que la valvula venza la inercia.
uint8_t  recircIndex = 0;  // Indice de recirculacion activo.
uint16_t riegoTime = 0;    // Contador local para calcular minutos en ticks de 100mS
uint16_t TimeSeg = 0;
uint16_t vsOperTime = 0;

// Leer parametros de tiempo de apertura/cierre:
void GetOperTimeParams(){
  
  switch (recircIndex) {
    // tiempos de Full apertura/cierre:
    case 0:
      vsTimeSegFin = tankSettingsService.readVSOperTime();  // tiempo de operacion 100% abierto o cerrado en segundos.
      vsOperTime = 10 * vsTimeSegFin;                       // En ticks de 100mS.
      break;
    // tiempos de posicionamiento al 25% de apertura. (partiendo desde valvula cerrada - dirección: abriendo)
    case 1:
      vsTimeSegFin  = tankSettingsService.readVSOpenTime25();
      vsOperTime    = 10 * vsTimeSegFin;  // En ticks de 100mS.
      break;
    // tiempos de posicionamiento al 50% de apertura. (partiendo desde valvula cerrada - dirección: abriendo)
    case 2:
      vsTimeSegFin = tankSettingsService.readVSOpenTime50();
      vsOperTime = 10 * vsTimeSegFin;  // En ticks de 100mS.
      break;
    // tiempos de posicionamiento desde el 25% de apertura. (partiendo desde la posicion actual hasta valvula cerrada - dirección: Cerrando.)
    case 3:
      vsTimeSegFin  = tankSettingsService.readVSOpenTime25() + 1; // corregir si es necesario
      vsOperTime = 10 * vsTimeSegFin;  // En ticks de 100mS.
      break;
    // tiempos de posicionamiento desde el 50% de apertura. (partiendo desde la posicion actual hasta valvula cerrada - dirección: Cerrando.)
    case 4:
      vsTimeSegFin = tankSettingsService.readVSOpenTime50() + 1;// corregir si es necesario
      vsOperTime = 10 * vsTimeSegFin;  // En ticks de 100mS.
      break; 
    
    // tiempos de posicionamiento desde el 50% de apertura al 25%.
    // (partiendo desde la posicion actual hasta la posicion de 25% - dirección: Cerrando.)
    case 5:
      vsTimeSegFin = tankSettingsService.readVSOpenTime50() - tankSettingsService.readVSOpenTime25(); // corregir si es necesario
      vsOperTime = 10 * vsTimeSegFin;  // En ticks de 100mS.
      break;   

    // tiempos de posicionamiento desde el 25% de apertura al 50%.
    // (partiendo desde la posicion actual hasta la posicion de 50% - dirección: Abriendo.)
    case 6:
      vsTimeSegFin = tankSettingsService.readVSOpenTime50() - tankSettingsService.readVSOpenTime25(); // corregir si es necesario
      vsOperTime = 10 * vsTimeSegFin;  // En ticks de 100mS.
      break;     
  }
}

// Enviar comando HTTP POST a la Bomba para activar/desactivar reset de PressControl:
void sendPumpReset(bool reset) {
  if (!WiFi.isConnected()) return;
  String host = tankSettingsService.readPumpHost();
  if (host.length() == 0) return;
  
  WiFiClient client;
  HTTPClient http;
  http.setTimeout(1000);
  String url = "http://" + host + "/rest/devState";
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  String payload = reset ? "{\"cmd_reset\":true}" : "{\"cmd_reset\":false}";
  int res = http.POST(payload);
  if (res > 0) {
    Serial.printf("[SERVICIO] POST cmd_reset %d a la Bomba (%s): %d\n", reset, host.c_str(), res);
  } else {
    Serial.printf("[SERVICIO] POST Fallo a la Bomba (%s), error: %s\n", host.c_str(), http.errorToString(res).c_str());
  }
  http.end();
}

// Sondeo periódico no bloqueante del estado de la Bomba de Llenado:
void pollPumpStatus() {
  if (millis() - lastPumpPollTime < PUMP_POLL_INTERVAL_MS) return;
  lastPumpPollTime = millis();

  if (!WiFi.isConnected()) {
    isPumpOnline = false;
    isPumpRunning = false;
    isPumpFail = false;
    return;
  }

  String host = tankSettingsService.readPumpHost();
  if (host.length() == 0) {
    isPumpOnline = false;
    isPumpRunning = false;
    isPumpFail = false;
    return;
  }

  static int pumpFailStreak = 0;
  WiFiClient client;
  HTTPClient http;
  http.setTimeout(400); // 400ms para evitar bloqueo del loop
  String url = "http://" + host + "/rest/devState";
  http.begin(client, url);
  int code = http.GET();

  if (code == 200) {
    DynamicJsonDocument doc(1024);
    DeserializationError err = deserializeJson(doc, http.getString());
    if (!err) {
      pumpFailStreak = 0;
      // 1. Estado de la bomba:
      if (doc.containsKey("pump_running") || doc.containsKey("pump_on")) {
        isPumpOnline  = true;
        isPumpRunning = (doc["pump_running"] | false) || (doc["pump_on"] | false);
        isPumpFail    = doc["pump_fail"] | false;
      } else if (doc.containsKey("state")) {
        int pmpState = doc["state"] | -1;
        isPumpOnline  = true;
        // Estado 1 = PS_ON_NO_WF (Marcha normal), Estado 3 = PS_ON_WF (Marcha forzada en prueba/recirculación):
        isPumpRunning = (pmpState == 1 || pmpState == 3);
        isPumpFail    = (pmpState == 2 || pmpState == 3);
      } else if (doc.containsKey("pump_online")) {
        isPumpOnline  = doc["pump_online"] | false;
        isPumpRunning = doc["pump_running"] | false;
        isPumpFail    = doc["pump_fail"] | false;
      }
    } else {
      if (++pumpFailStreak >= 3) {
        isPumpOnline = false;
        isPumpRunning = false;
        isPumpFail = false;
      }
    }
  } else {
    if (++pumpFailStreak >= 3) {
      isPumpOnline = false;
      isPumpRunning = false;
      isPumpFail = false;
    }
  }
  http.end();
}

// Gestión de arranque de bomba en Lazo Cerrado al servir agua a la casa:
void checkAndStartPumpOnService() {
  bool cmdsrv = tankStateService.readCmdServ();

  // Si no se está solicitando servir agua, restablecer máquina de estado
  if (!cmdsrv) {
    if (servicePumpStep == SP_PULSING_RESET) {
      sendPumpReset(false);
    }
    servicePumpStep = SP_IDLE;
    return;
  }

  // Pre-condición: Si la bomba está OFFLINE, verificar si se permite apertura manual de MV01
  bool allowManualMv01 = tankSettingsService.readManualMv01();
  if (!isPumpOnline && !allowManualMv01) {
    Serial.println("[SERVICIO] Bomba OFFLINE y modo manual no permitido. Abortando solicitud de servicio sin mover MV01.");
    tankStateService.update([&](TankState& state) {
      state.cmdsrv = false;
      state.vsCmnd = false; // CERRAR MV01
      state.vsMotOn = true;
      state.tkstate = TS_IDLE;
      return StateUpdateResult::CHANGED;
    }, "service");
    servicePumpStep = SP_IDLE;
    return;
  }

  switch (servicePumpStep) {
    case SP_IDLE:
      Serial.println("[SERVICIO] Iniciando servicio: Abriendo MV01...");
      servicePumpStep = SP_WAIT_VALVE_OPEN;
      break;

    case SP_WAIT_VALVE_OPEN:
      // Esperar que MV01 esté 100% abierta por fin de carrera
      if (vslsState == VS_OPEN) {
        if (!isPumpOnline) {
          Serial.println("[SERVICIO] MV01 100% abierta en modo manual. Permanece ABIERTA para pruebas/gravedad (bomba offline).");
          servicePumpStep = SP_RUNNING;
          break;
        }
        Serial.println("[SERVICIO] MV01 100% abierta. Esperando 2 seg de reposo para inundar succión...");
        serviceTimer = 20; // 2.0 s (20 ticks de 100ms)
        servicePumpStep = SP_STABILIZING;
      }
      break;

    case SP_STABILIZING:
      if (serviceTimer > 0) {
        serviceTimer--;
      }
      if (serviceTimer == 0) {
        Serial.println("[SERVICIO] Succión inundada. Enviando pulso de arranque (RESET ON)...");
        sendPumpReset(true);
        resetPulseTimer = 20; // 2.0 s
        servicePumpStep = SP_PULSING_RESET;
      }
      break;

    case SP_PULSING_RESET:
      if (resetPulseTimer > 0) {
        resetPulseTimer--;
      }
      if (resetPulseTimer == 0) {
        sendPumpReset(false);
        Serial.println("[SERVICIO] Pulso finalizado (RESET OFF). Supervisando marcha (hasta 30 seg)...");
        serviceTimer = 300; // 30.0 seg (300 ticks de 100ms)
        servicePumpStep = SP_VERIFYING_RUN;
      }
      break;

    case SP_VERIFYING_RUN:
      if (serviceTimer > 0) {
        serviceTimer--;
      }

      // Si la bomba confirma marcha (state == 1)
      if (isPumpRunning) {
        Serial.println("[SERVICIO] Bomba en marcha confirmada.");
        servicePumpStep = SP_RUNNING;
        break;
      }

      // Si vence el tiempo o la bomba no arranca, mantenemos MV01 abierta para suministro por gravedad/booster
      if (serviceTimer == 0 || !isPumpOnline) {
        Serial.println("[SERVICIO] Tiempo de sincronización finalizado. MV01 permanece ABIERTA para suministro a la casa.");
        servicePumpStep = SP_RUNNING;
      }
      break;

    case SP_RUNNING:
      // Servicio activo suministrando a la casa con MV01 abierta
      break;

    case SP_FAIL_ABORT:
      // Auto-cierre de MV01 solo si el usuario cancela servicio
      servicePumpStep = SP_IDLE;
      break;
  }
}

// Monitoreo de Sensores del Tanque: (originId = "tank")
// Esta tarea se ejecuta periódicamente cada 100mS.
void IOMonitor(boolean forceUpdate) {
  bool hls_tempState;
  
  // Leer estado actual del sensor de alto nivel y validar cuando el tanque este lleno para temporizar el cambio de
  // estado
  // Leer  Sensor de Alto nivel. (usando la bandera de contacto normalmente abierto o cerrado)
  hls_tempState = digitalRead(tankStateService._pinHLS) ^ tankSettingsService.readHLS_InvFlag(); 

  // Hay alto nivel validado?
  if (!hls_tempState) {
    if (++hlTime == SENSOR_HLD_VALID_TIME) {
      laststate_hls = hls_tempState;  // Leer estado de Alto nivel.(TANQUE LLENO)
    }
  } else {
    hlTime = 0;
    laststate_hls = hls_tempState;  // Leer estado de Alto nivel. (NORMAL)
  }

  // Estado funcional del sensor de nivel (0: Lleno/HLS activo, 1: Disponible/HLS normal):
  levelState = laststate_hls ? 1 : 0;            

  // Estado de limitswitches de valvula motorizada:
  laststate_vsOpen   = !digitalRead(tankStateService._pinMV01_SW_OPEN);   // Limitswitch de valvula abierta (Activo Cerrado).
  laststate_vsClosed = !digitalRead(tankStateService._pinMV01_SW_CLOSE);  // Limitswitch de valvula cerrada (Activo Cerrado).
  vslsState          = laststate_vsOpen + 2 * laststate_vsClosed;         // Calcular estado funcional de valvula de servicio.

  // Estamos regando??
  // Si es asi, contabilizar el tiempo de riego restante.
  lastCmdRieg = digitalRead(tankStateService._pinSOV2);

  // Control de tiempo de riego remanente cuando estamos regando el jardin:
  // ----------------------------------------------------------------------
  if (lastCmdRieg) {
    if (--riegoTime == 0) {
      lastCmdRieg = false;
    }
    // Paso un segundo?
    if (riegoTime % 10 == 0)
      TimeSeg = riegoTime / 10;
  } else {
    // Leer tiempo de riego configurado en minutos.
    riegoCount = tankSettingsService.readRiegTime();
    riegoTime  = 600 * riegoCount;  // En ticks de 100mS.
    TimeSeg    = riegoTime / 10;    // En ticks de 1 seg.
  }
  // ----------------------------------------------------------------------
  
  // --------------------------------------------------------------------------------------------
  //  Control de accionamiento durante la operacion de valvula motorizada abriendo o cerrando.
  //  con control de apertura parcial para obtener 2 valores de recirculación: 25 y 50% durante
  //  la purga de la linea de succión agua de cuidad, para poder cebar la bomba de llenado.
  // --------------------------------------------------------------------------------------------
  switch (vslsState) {
    // Valvula Abierta:
    case VS_OPEN:
    // Valvula cerrada:
    case VS_CLOSED:
      GetOperTimeParams();
      // retardo de 1 seg. para vencer la inercia de la valvula.
      if ((vsInitTime > 0) && (--vsInitTime == 0)){
        // Detener motor.
        vsmotorOn = false;
      }  
    break;
    // valvula se mueve...
    default:
      // Actualizar siempre y cuando el motor este activo.
      if (vsmotorOn){
        // recargar tiempo de vencer la inercia cuando la valvula esta completamente abierta o cerrada.
        vsInitTime = 10;
        // un tick menos...
        --vsOperTime == 0;
        // ya paso un segundo?
        if (vsOperTime % 10 == 0) {
          // un segundo menos..
          vsTimeSegFin--;

          // tiempo de operación alcanzado? (a veces restamos hasta un valor menor a cero y por ser uint8_t lleva 255)
          if ((vsTimeSegFin == 0) || (vsTimeSegFin == 255)) {
            // Detener motor.
            vsmotorOn = false;
            // Cargar tiempo luego de llegar a la posicion deseada:
            GetOperTimeParams();
          }
        }
        if (vsOperTime % 10 == 0) {
          Serial.printf("vsTimeSegFin = %d\r\n", vsTimeSegFin);
          Serial.printf("motor:%d\r\n", vsmotorOn);
        }
      }
  }
  // ----------------------------------------------------------------------------------------
  // checkAndStartPumpOnService(); // Deshabilitado para control operativo directo
  // ----------------------------------------------------------------------------------------
  
  // Watchdog de seguridad de llenado continuo (40 min máx para proteger contra vaciados/fugas):
  if (digitalRead(tankStateService._pinSOV1)) {
    if (++fillWatchdogTicks >= FILL_MAX_TICKS) {
      Serial.println("[WATCHDOG] Llenado continuo superó 40 min. Desenergizando SOV1 por seguridad!");
      tankStateService.update([&](TankState& state) {
        state.cmdfill = false;
        state.sov1On  = false;
        state.tkstate = TS_IDLE;
        return StateUpdateResult::CHANGED;
      }, "watchdog");
      fillWatchdogTicks = 0;
    }
  } else {
    fillWatchdogTicks = 0;
  }

  // reportar cambios de estado desde el BackEND/Proceso, solo si la red esta conectada.
  if (WiFi.isConnected()) {
    // Enviar estados del tanque, a menos que haya algun cambio.
  
    // --------------------------------------------------------------------------------------------------------------------
    // Nota sobre la siguiente funcion Lambda (solo en C++11): El uso de esta sintaxis significa que se obtienen todos los
    // valores de cada variable externa de la clase TankState por referencia, dentro del contexto actual de la función Labda.
    // en este caso, TankState es una clase global para main.cpp
    // --------------------------------------------------------------------------------------------------------------------
  
    tankStateService.update([&](TankState& state) {
      
      dataUpdated = forceUpdate;

      static bool lastCmdFill = false;
      static bool lastSov1On  = false;
      static bool lastSov2On  = false;
      static unsigned long lastHeartbeatTime = 0;
      bool heartbeatDue = (millis() - lastHeartbeatTime >= 1000);

      // Hay cambios de estado en variables de proceso o en estado de la bomba o venció el heartbeat de 1s?
      if (!heartbeatDue && !dataUpdated &&
          (levelState == state.levelstate) && (distCalc == state.Level) && (vslsState == state.vsState) &&
          (state.cmdrieg == lastCmdRieg) && (state.cmdfill == lastCmdFill) && 
          (state.sov1On == lastSov1On) && (state.sov2On == lastSov2On) &&
          (state.time_rem == TimeSeg) && (state.time_vsoper == vsTimeSegFin) &&
          (state.vsMotOn == vsmotorOn) &&
          (state.pump_online == isPumpOnline) && (state.pump_running == isPumpRunning) && (state.pump_fail == isPumpFail)){
        return StateUpdateResult::UNCHANGED;  // No hay cambios de estado.
      } else {                                // Reportar cambios en estados.
        lastHeartbeatTime = millis();
        lastCmdFill       = state.cmdfill;
        lastSov1On        = state.sov1On;
        lastSov2On        = state.sov2On;
        state.swhlvlOn    = laststate_hls;
        state.Level       = distCalc;
        state.levelstate  = levelState;       // Estado consolidado de sensores discretos de nivel de agua.
        state.vsState     = vslsState;        // Estado de posicionamiento de valvula motorizada.
        state.cmdrieg     = lastCmdRieg;      // Finalizar riego cuando toque hacerlo..
        state.time_rem    = TimeSeg;          // Actualizar tiempos en segundos.
        state.time_vsoper = vsTimeSegFin;
        state.vsMotOn     = vsmotorOn;
        state.pump_online = isPumpOnline;
        state.pump_running= isPumpRunning;
        state.pump_fail   = isPumpFail;
        state.dataupdate  = false;
        state.onIOUpdated(state);
        return StateUpdateResult::CHANGED;
      }
    },
    "tank");
  }
  else
    Serial.println("Wifi: Desconectado...");
}

// Message reading from sensor using RS232/RS485:
bool GetSensorData() {
  // incomming data?
  if (sensor.available() > 0) {  // enter "receiving" state if something is waiting to be read()

    LBuff[RxIdx++] = sensor.read();  // read first char

    lastCharTime = millis();  // timer start

    while ((sensor.available() > 0) || ((millis() - lastCharTime < eotTimeoutMs) && (RxIdx < MAX_BUFFER_SIZE))) {
      if (sensor.available() > 0) {
        LBuff[RxIdx++] = sensor.read();
        lastCharTime = millis();  // timer restart
      }
    }

    // exit from "receiving" state due to:
    // - timeout (proper eot marker)
    // - buffer full condition (TODO: should be reported as an error)

    // "close" buffer
    LBuff[RxIdx] = 0;

    // AddLog(LOG_LEVEL_INFO,PSTR("LBuff: %s"),LBuff);

    // Pasar al String para procesar...
    //SensorMsg = LBuff;

    // convertir todo en mayusculas...
    //SensorMsg.toUpperCase();
    RxIdx = 0;
    return true;
  }

  return false;
}

/*/ Medición de Nivel ultrasónico utilizando el sensor AJ-SR04M
void LevelMeasure() {
  static bool dataOK;
  uint16_t chksum;

  switch (SenState) {
    // Enviar comando al sensor:
    case SS_CMD:
     // sensor.flush();
      sensor.write(0x55);
      SenState++;
      break;

    // Proceso de lectura en ASCII del valor de distancia:
    case SS_READ:
      dataOK = GetSensorData();
      Serial.printf("LBuff: %02X%02X%02X%02X dataOK:%d\r\n", LBuff[0], LBuff[1], LBuff[2], LBuff[3], dataOK);
      distance = 0;
      if (!dataOK) {
        RestTime = 0;
        SenState = SS_REST;
      } else
        SenState++;
      break;

    // Calculo de distancia.
    case SS_CALC:
#ifndef BINARY_DATA
      // Inicio de mensaje correcto?
      if (dataOK && SensorMsg.startsWith("GAP=")) {
        // Extraer nivel en milimetros desde el sensor:
        DisStr = SensorMsg.substring(4, 8);
        if (DisStr.length() == 4) {
          distance = DisStr.toInt();  // Leer valor numerico de distancia en mm.
          distance = distance / 10;   // Convertir en cms.
        }
      } else if (SensorMsg == "") {
        sensorOK = false;
      }
#else
      if (dataOK) {
        distance = LBuff[1] * 256 + LBuff[2];
        chksum   = LBuff[0] + LBuff[1] + LBuff[2];
       // dataOK   = (((chksum & 0xFF) + 1) == LBuff[3]);
        distance = distance / 10;
        //  Serial.printf("distance: %d\r\nchecksum: %02X\r\n", distance, chksum );
        SenState++;
      } else {
        RestTime = 0;
        SenState = SS_REST;
      }
#endif
      break;

    // Medición de Nivel:
    case SS_LEVEL:
      if ((distance != 0) && dataOK) {  // Data valida?

        // Leer confuración de alturas de tanque:
        MaxLevel = tankSettingsService.readMax();  // Distancia de nivel máximo.
        MinLevel = tankSettingsService.readMin();  // Distancia de nivel mínimo.

        // Serial.printf("Max:%d Min:%d\r\n", MaxLevel, MinLevel);
        // Calcular valor % de nivel de agua del tanque:
        distCalc = (MinLevel - distance) * 100.0 / (MinLevel - MaxLevel);
        // Serial.printf("Nivel % =%5.2f\r\n",distCalc);
        sensor.flush();
      }
      RestTime = 0;
      SenState++;
      break;

    // Período de descanso:
    case SS_REST:
      if (++RestTime == 10)
        SenState = SS_CMD;
      break;
  }
}*/

// Medición de Nivel ultrasónico utilizando el sensor AJ-SR04M
void LevelMeasure() {
  static bool dataOK;
  uint16_t chksum;

  switch (SenState) {
    // Enviar comando al sensor:
    case SS_CMD:
      sensor.flush(); // Limpiar residuos anteriores
      sensor.write(0x55);
      SenState = SS_READ;
      break;

    // Proceso de lectura en ASCII del valor de distancia:
    case SS_READ:
      dataOK = GetSensorData();
      Serial.printf("LBuff: %02X%02X%02X%02X dataOK:%d\r\n", LBuff[0], LBuff[1], LBuff[2], LBuff[3], dataOK);
      distance = 0;
      if (!dataOK) {
        RestTime = 0;
        SenState = SS_REST;
        Serial.println("Sensor sin respuesta.. descansando...");
      } else {
        SenState = SS_CALC;
      }
      break;

    // Calculo de distancia.
    case SS_CALC:
#ifndef BINARY_DATA
      // Inicio de mensaje correcto?
      if (dataOK && SensorMsg.startsWith("GAP=")) {
        // Extraer nivel en milimetros desde el sensor:
        DisStr = SensorMsg.substring(4, 8);
        if (DisStr.length() == 4) {
          distance = DisStr.toInt();  // Leer valor numerico de distancia en mm.
          distance = distance / 10;   // Convertir en cms.
        }
      } else if (SensorMsg == "") {
        sensorOK = false;
      }
      SenState = SS_LEVEL;
#else
      if (dataOK) {
        distance = LBuff[1] * 256 + LBuff[2];
        chksum = LBuff[0] + LBuff[1] + LBuff[2];
        dataOK = ((chksum & 0xFF) == LBuff[3]);
        distance = distance / 10;
        Serial.printf("distance: %d\r\nchecksum: %02X\r\n", distance, chksum );
        SenState = SS_LEVEL;
      } else {
        RestTime = 0;
        SenState = SS_REST;
      }
#endif
      break;

    // Medición de Nivel:
    case SS_LEVEL:
      if ((distance != 0) && dataOK) {  // Data valida?

        // Leer confuración de alturas de tanque:
        MaxLevel = tankSettingsService.readMax();  // Distancia de nivel máximo.
        MinLevel = tankSettingsService.readMin();  // Distancia de nivel mínimo.

        // Calcular valor % de nivel de agua del tanque:
        distCalc = (MinLevel - distance) * 100.0 / (MinLevel - MaxLevel);
      }
      RestTime = 0;
      SenState = SS_REST;
      sensor.flush();
      break;

    // Período de descanso:
    case SS_REST:
      if (++RestTime == 10)
        SenState = SS_CMD; // Volver a disparar en el siguiente ciclo
      break;
  }
}


void setup() {
  // start serial and filesystem
  Serial.begin(SERIAL_BAUD_RATE);
#ifdef ESP32
  esp_err_t nvs_err = nvs_flash_init();
  if (nvs_err == ESP_ERR_NVS_NO_FREE_PAGES || nvs_err == ESP_ERR_NVS_NEW_VERSION_FOUND) {
    nvs_flash_erase();
    nvs_flash_init();
  }
#endif
  Serial.println("\r\nReact Water Control v1.0");
  Serial.println("\r\nTank Controller v1.0");

  // Inicializar puerto serial de sensor de nivel:
#if defined(ESP32)
  Serial1.begin(SENSOR_BAUD_RATE, SERIAL_8N1, SS_RX, SS_TX);
#else
  sensor.begin(SENSOR_BAUD_RATE);
#endif
  sensor.setTimeout(500);

  // Iniciar framework del proyecto ( por ahora, es un DEMO )
  esp8266React.begin();

  // Carga inicial de settings del tanque:
  tankStateService.begin();  // Servicio de Control del Tanque de Agua.

  tankSettingsService.begin();  // Iniciar servicio de configuración del tanque.

  tankMqttSettingsService.begin();  // Iniciar servicio MQTT del tanque. ( Telemetría y Control )

  // leer tiempo de operacion 100% abierto o cerrado en segundos.
  vsTimeSegFin = tankSettingsService.readVSOperTime();
  
  // Manejador de cambios de estado del Sistema:
  update_handler_id_t myUpdateHandler = tankStateService.addUpdateHandler([&](const String& originId) {
    Serial.print("Los estados fueron actualizados por: ");
    Serial.println(originId);
    // Si se ha cambiado algo desde la web....
    if(originId.startsWith("websocket")){
      recircIndex = tankStateService.readRecIndex();
      // Leer estado actual del motor:
      vsmotorOn = digitalRead(tankStateService._pinMV01_ON);
      Serial.printf("recIndex:%d\r\n", recircIndex);
      Serial.printf("motor:%d\r\n", vsmotorOn);
      GetOperTimeParams();
    }
  });

  // Iniciar WebServer y WebSocket server.
  server.begin();
  // Arrancar timer de simulacion de nivel de agua %.
  Timer = millis();
}

void loop() {
  // run the framework's loop function
  esp8266React.loop();
  
  // Sondeo asíncrono no bloqueante de la bomba de llenado (cada 3 s):
  pollPumpStatus();

  // Muestreo de Sensores cada 100mS y se reporta si y solo si hay algun cambio:
  if (millis() - Timer >= 100) {
    Timer = millis();
    IOMonitor(false);
    if (++count == 5) {
      LevelMeasure();
      count = 0;
      if (dataUpdated) {
        Serial.printf("levelState: %d\r\n", levelState);
        Serial.printf("vsState   : %d\r\n", vslsState);
      }
    }
  }
}
