import React, { FC, useContext, useState } from 'react';
import { ValidateFieldsError } from 'async-validator';

import { Button } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';

import * as SecurityApi from "../../api/security";
import { SecuritySettings } from '../../types';
import { ButtonRow, FormLoader, MessageBox, SectionContent, ValidatedPasswordField } from '../../components';
import { SECURITY_SETTINGS_VALIDATOR, validate } from '../../validators';
import { updateValue, useRest } from '../../utils';
import { AuthenticatedContext } from '../../contexts/authentication';

const SecuritySettingsForm: FC = () => {
  const [fieldErrors, setFieldErrors] = useState<ValidateFieldsError>();
  const {
    loadData, saving, data, setData, saveData, errorMessage
  } = useRest<SecuritySettings>({ read: SecurityApi.readSecuritySettings, update: SecurityApi.updateSecuritySettings });

  const authenticatedContext = useContext(AuthenticatedContext);
  const updateFormValue = updateValue(setData);

  const content = () => {
    if (!data) {
      return (<FormLoader onRetry={loadData} errorMessage={errorMessage} />);
    }

    const validateAndSubmit = async () => {
      try {
        setFieldErrors(undefined);
        await validate(SECURITY_SETTINGS_VALIDATOR, data);
        await saveData();
        await authenticatedContext.refresh();
      } catch (errors: any) {
        setFieldErrors(errors);
      }
    };

    return (
      <>
        <ValidatedPasswordField
          fieldErrors={fieldErrors}
          name="jwt_secret"
          label="Clave JWT"
          fullWidth
          variant="outlined"
          value={data.jwt_secret}
          onChange={updateFormValue}
          margin="normal"
        />
        <MessageBox
          level="info"
          message="La clave secreta JWT firma los tokens de autenticación. Al modificarla, todos los usuarios seran sacados del Sistema."
          mt={1}
        />
        <ButtonRow mt={2}>
          <Button startIcon={<SaveIcon />} disabled={saving} variant="contained" color="primary" type="submit" onClick={validateAndSubmit}>
            Guardar
          </Button>
        </ButtonRow>
      </>
    );
  };

  return (
    <SectionContent title='Configurar Seguridad' titleGutter>
      {content()}
    </SectionContent>
  );
};

export default SecuritySettingsForm;
