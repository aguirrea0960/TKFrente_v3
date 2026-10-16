import Schema from "async-validator";

import { IP_OR_HOSTNAME_VALIDATOR } from './shared';

export const MQTT_SETTINGS_VALIDATOR = new Schema({
  host: [
    { required: true, message: "Host is required" },
    IP_OR_HOSTNAME_VALIDATOR
  ],
  port: [
    { required: true, message: "Se requiere un Puerto" },
    { type: "number", min: 0, max: 65535, message: "Puerto debe ser entre 0 y 65535" }
  ],
  keep_alive: [
    { required: true, message: "Se requiere valor de Keep alive" },
    { type: "number", min: 1, max: 86400, message: "Valor de Keep alive debe estar entre 1 y 86400" }
  ],
  max_topic_length: [
    { required: true, message: "Longitud Máxima de topico es requerida" },
    { type: "number", min: 16, max: 1024, message: "Longitud Máxima de topico debe estar entre 16 y 1024" }
  ]
});
