import { FC, useState } from 'react';
import { ValidateFieldsError } from 'async-validator';
import { range } from 'lodash';

import { Button, Checkbox, MenuItem } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';

import * as APApi from "../../api/ap";
import { APProvisionMode, APSettings } from '../../types';
import { BlockFormControlLabel, ButtonRow, FormLoader, SectionContent, ValidatedPasswordField, ValidatedTextField } from '../../components';
import { createAPSettingsValidator, validate } from '../../validators';
import { numberValue, updateValue, useRest } from '../../utils';

export const isAPEnabled = ({ provision_mode }: APSettings) => {
  return provision_mode === APProvisionMode.AP_MODE_ALWAYS || provision_mode === APProvisionMode.AP_MODE_DISCONNECTED;
};

const APSettingsForm: FC = () => {
  const [fieldErrors, setFieldErrors] = useState<ValidateFieldsError>();
  const {
    loadData, saving, data, setData, saveData, errorMessage
  } = useRest<APSettings>({ read: APApi.readAPSettings, update: APApi.updateAPSettings });

  const updateFormValue = updateValue(setData);

  const content = () => {
    if (!data) {
      return (<FormLoader onRetry={loadData} errorMessage={errorMessage} />);
    }

    const validateAndSubmit = async () => {
      try {
        setFieldErrors(undefined);
        await validate(createAPSettingsValidator(data), data);
        saveData();
      } catch (errors: any) {
        setFieldErrors(errors);
      }
    };

    return (
      <>
        <ValidatedTextField
          fieldErrors={fieldErrors}
          name="provision_mode"
          label="Activar el AP&hellip;"
          value={data.provision_mode}
          fullWidth
          select
          variant="outlined"
          onChange={updateFormValue}
          margin="normal"
        >
          <MenuItem value={APProvisionMode.AP_MODE_ALWAYS}>Siempre</MenuItem>
          <MenuItem value={APProvisionMode.AP_MODE_DISCONNECTED}>Cuando se desconecte red WiFi</MenuItem>
          <MenuItem value={APProvisionMode.AP_NEVER}>Nunca</MenuItem>
        </ValidatedTextField>
        {
          isAPEnabled(data) &&
          <>
            <ValidatedTextField
              fieldErrors={fieldErrors}
              name="ssid"
              label="SSID del AP"
              fullWidth
              variant="outlined"
              value={data.ssid}
              onChange={updateFormValue}
              margin="normal"
            />
            <ValidatedPasswordField
              fieldErrors={fieldErrors}
              name="password"
              label="clave de acceso"
              fullWidth
              variant="outlined"
              value={data.password}
              onChange={updateFormValue}
              margin="normal"
            />
            <ValidatedTextField
              fieldErrors={fieldErrors}
              name="channel"
              label="Canal preferido"
              value={numberValue(data.channel)}
              fullWidth
              select
              type="number"
              variant="outlined"
              onChange={updateFormValue}
              margin="normal"
            >
              {
                range(1, 14).map((i) => <MenuItem key={i} value={i}>{i}</MenuItem>)
              }
            </ValidatedTextField>
            <BlockFormControlLabel
              control={
                <Checkbox
                  name="ssid_hidden"
                  checked={data.ssid_hidden}
                  onChange={updateFormValue}
                />
              }
              label="Ocultar SSID?"
            />
            <ValidatedTextField
              fieldErrors={fieldErrors}
              name="max_clients"
              label="Cantidad máxima de Conexiones."
              value={numberValue(data.max_clients)}
              fullWidth
              select
              type="number"
              variant="outlined"
              onChange={updateFormValue}
              margin="normal"
            >
              {
                range(1, 5).map((i) => <MenuItem key={i} value={i}>{i}</MenuItem>)
              }
            </ValidatedTextField>
            <ValidatedTextField
              fieldErrors={fieldErrors}
              name="local_ip"
              label="IP Local"
              fullWidth
              variant="outlined"
              value={data.local_ip}
              onChange={updateFormValue}
              margin="normal"
            />
            <ValidatedTextField
              fieldErrors={fieldErrors}
              name="gateway_ip"
              label="Puerta de Enlace"
              fullWidth
              variant="outlined"
              value={data.gateway_ip}
              onChange={updateFormValue}
              margin="normal"
            />
            <ValidatedTextField
              fieldErrors={fieldErrors}
              name="subnet_mask"
              label="Máscara de subred"
              fullWidth
              variant="outlined"
              value={data.subnet_mask}
              onChange={updateFormValue}
              margin="normal"
            />
          </>
        }
        <ButtonRow mt={1}>
          <Button startIcon={<SaveIcon />} disabled={saving} variant="contained" color="primary" type="submit" onClick={validateAndSubmit}>
            Guardar
          </Button>
        </ButtonRow>
      </>
    );
  };

  return (
    <SectionContent title='Configuración de AP' titleGutter>
      {content()}
    </SectionContent>
  );
};

export default APSettingsForm;
