import React from 'react';

type UpdateEntity<S> = (
  state: ((prevState: Readonly<S>) => S)
) => void;

/**
 * Prepara un valor numérico para ser mostrado en un TextField.
 * Si no es un número válido, devuelve una cadena vacía.
 */
export const numberValue = (value: any) => {
  const n = Number(value);
  return isNaN(n) || value === undefined ? "" : n;
};

/**
 * Extrae el valor del evento según el tipo de input.
 */
export const extractEventValue = (event: React.ChangeEvent<HTMLInputElement>) => {
  const { name, type, value, valueAsNumber, checked } = event.target;

  if (type === "checkbox") return checked;
  // Mantenemos tu lógica de valueAsNumber pero añadimos el "seguro" para litros e ID
  if (type === "number" || name === "eq_liters" || name === "user_id") {
    return isNaN(valueAsNumber) ? Number(value) : valueAsNumber;
  }

  return value;
};

/**
 * Función principal para vincular inputs con el estado (Tu versión Genérica).
 */
export const updateValue = <S>(updateEntity: UpdateEntity<S>) => (
  (event: React.ChangeEvent<HTMLInputElement>) => {
    updateEntity((prevState) => ({
      ...prevState,
      [event.target.name]: extractEventValue(event)
    }));
  }
);
