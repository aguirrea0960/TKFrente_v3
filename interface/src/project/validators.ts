import Schema from "async-validator";

export const TANK_MQTT_SETTINGS_VALIDATOR = new Schema({
  unique_id: {
    required: true, message: "Favor indique un ID único"
  },
  name: {
    required: true, message: "Favor indique un Nombre descriptivo"
  },
  mqtt_path: {
    required: true, message: "Favor indique una ruta MQTT base"
  }
});

export const TANK_SETTINGS_VALIDATOR = new Schema({
  level_min: {
    required: true, message: "Favor indique distancia para nivel mínimo (0%)"
  },
  level_max: {
    required: true, message: "Favor indique distancia para nivel máximo (100%)"
  }
});
