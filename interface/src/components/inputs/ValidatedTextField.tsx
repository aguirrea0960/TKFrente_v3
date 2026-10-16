import { FC } from 'react';
import { ValidateFieldsError } from 'async-validator';
import { TextField, TextFieldProps } from '@mui/material';

interface ValidatedFieldProps {
  fieldErrors?: ValidateFieldsError;
  name: string;
}

export type ValidatedTextFieldProps = ValidatedFieldProps & TextFieldProps;

const ValidatedTextField: FC<ValidatedTextFieldProps> = ({ fieldErrors, name, ...rest }) => {
  // Extraemos los errores específicos de este campo
  const errors = fieldErrors && fieldErrors[name];

  // Unimos los mensajes de error en un solo string (corregido con paréntesis en '(e)')
  const errorMessage = errors ? errors.map((e) => e.message).join('. ') : rest.helperText;

  return (
    <TextField
      {...rest}
      name={name}
      error={!!errors}
      helperText={errorMessage}
    />
  );
};

export default ValidatedTextField;
