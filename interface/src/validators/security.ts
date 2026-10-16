import Schema, { InternalRuleItem } from "async-validator";

import { User } from "../types";

export const SECURITY_SETTINGS_VALIDATOR = new Schema({
  jwt_secret: [
    { required: true, message: "Clave JWT es requerida" },
    { type: "string", min: 1, max: 64, message: "Clave JWT debe tener entre 1 y 64 caracteres" }
  ]
});

export const createUserValidator = (users: User[], creating: boolean) => new Schema({
  username: [
    { required: true, message: "Nombre de usuario requerido" },
    { type: "string", pattern: /^[a-zA-Z0-9_\\.]{1,24}$/, message: "Debe estar desde 1-24 characters: alfanuméricos, '_' o '.'" },
    ...(creating ? [createUniqueUsernameValidator(users)] : [])
  ],
  password: [
    { required: true, message: "Ingrese una Clave por favor" },
    { type: "string", min: 1, max: 64, message: "Clave debe tener de 1-64 caracteres" }
  ],
});

export const createUniqueUsernameValidator = (users: User[]) => ({
  validator(rule: InternalRuleItem, username: string, callback: (error?: string) => void) {
    if (username && users.find((u) => u.username === username)) {
      callback("Usuario ya esta activo");
    } else {
      callback();
    }
  }
});

