import Schema from 'async-validator';

import { IP_OR_HOSTNAME_VALIDATOR } from './shared';

export const NTP_SETTINGS_VALIDATOR = new Schema({
  server: [
    { required: true, message: "Servidor requerido", },
    IP_OR_HOSTNAME_VALIDATOR
  ],
  tz_label: {
    required: true, message: "Zona Horaria requerida"
  }
});
