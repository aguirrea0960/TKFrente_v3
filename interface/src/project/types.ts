export interface TankState {
  sov1_on: boolean;   // Estado de valvula solenoide de llenado (SOV1)
  sov2_on: boolean;   // Estado de valvula solenoide de Riego (SOV2)
  hl_on: boolean;     // Estado de sensor de alto nivel de agua (HLS, discreto)
  level: number;      // Nivel porcentual continuo via sensor ultrasonico AJ-SR04M (0.0 a 100.0%)
  cmd_fill: boolean;  // Comando de llenado de tanque
  cmd_serv: boolean;  // Comando de servicio a la casa
  cmd_rieg: boolean;  // Comando de Riego (on/off)
  cmd_rec50: boolean; // Comando para recircular al 50%
  cmd_rec25: boolean; // Comando para recircular al 25%
  state: number;      // Estado de funcionamiento del tanque (0 a 9)
  vs_state: number;   // Estado de valvula motorizada de servicio (0=MOVING, 1=OPEN, 2=CLOSED, 3=INIT, 4=RECIRC)
  time_rem: number;   // Tiempo restante en segundos (riego o ciclo)
  time_vsoper: number;// Tiempo de operacion de valvula motorizada abriendo o cerrando en segundos
  pump_online?: boolean;  // Bomba de llenado responde por red (Online)
  pump_running?: boolean; // Bomba en marcha confirmada (PS_ON_NO_WF)
  pump_fail?: boolean;    // Bomba en falla de agua (PS_OFF_WF)
}

export interface TankMqttSettings {
  unique_id: string;
  name: string;
  mqtt_path: string;
  pump_path: string;
}

export interface TankSettings {
  level_min: number;
  level_max: number;
  rieg_time: number;
  vs_toper: number;
  vs_topen50: number;
  vs_topen25: number;
  hls_invert: boolean;
  pump_host?: string;
}
