import Schema from "async-validator";

import { WiFiSettings } from "../types";

import { HOSTNAME_VALIDATOR, IP_ADDRESS_VALIDATOR } from "./shared";

export const createWiFiSettingsValidator = (wifiSettings: WiFiSettings) => new Schema({
  ssid: [
    { required: true, message: "SSID es Requerido" },
    { type: "string", max: 32, message: "El SSID debe tener hasta 32 characters" }
  ],
  password: { type: "string", max: 64, message: "La Clave debe tener hasta 64 caracteres" },
  hostname: [
    { required: true, message: "Nombre de Host requerido" },
    HOSTNAME_VALIDATOR
  ],
  ...(wifiSettings.static_ip_config && {
    local_ip: [
      { required: true, message: "IP Local requerida" },
      IP_ADDRESS_VALIDATOR
    ],
    gateway_ip: [
      { required: true, message: "IP de Puerta de Enlace requerida" },
      IP_ADDRESS_VALIDATOR
    ],
    subnet_mask: [
      { required: true, message: "Máscara de SubRed requerida" },
      IP_ADDRESS_VALIDATOR
    ],
    dns_ip_1: IP_ADDRESS_VALIDATOR,
    dns_ip_2: IP_ADDRESS_VALIDATOR,
  })
});
