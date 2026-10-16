import Schema from 'async-validator';

export const SIGN_IN_REQUEST_VALIDATOR = new Schema({
  username: {
    required: true, message: "Por favor ingrese un nombre"
  },
  password: {
    required: true, message: "Por favor coloque clave de acceso"
  }
});
