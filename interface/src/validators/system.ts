import Schema from "async-validator";

export const OTA_SETTINGS_VALIDATOR = new Schema({
  port: [
    { required: true, message: "Se requiere un puerto" },
    { type: "number", min: 1025, max: 65535, message: "Valor del Puerto debe estar entre 1025 y 65535" }
  ],
  password: [
    { required: true, message: "Clave Requerida" },
    { type: "string", min: 1, max: 64, message: "La Clave debe tener entre 1 y 64 caracteres" }
  ]
});
