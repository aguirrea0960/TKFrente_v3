import { FC, useState } from 'react';
import { ValidateFieldsError } from 'async-validator';

import { Button, Checkbox } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';

import * as MqttApi from "../../api/mqtt";
import { MqttSettings } from '../../types';
import { BlockFormControlLabel, ButtonRow, FormLoader, SectionContent, ValidatedPasswordField, ValidatedTextField } from '../../components';
import { MQTT_SETTINGS_VALIDATOR, validate } from '../../validators';
import { numberValue, updateValue, useRest } from '../../utils';

const MqttSettingsForm: FC = () => {
  const [fieldErrors, setFieldErrors] = useState<ValidateFieldsError>();
  const {
    loadData, saving, data, setData, saveData, errorMessage
  } = useRest<MqttSettings>({ read: MqttApi.readMqttSettings, update: MqttApi.updateMqttSettings });

  const updateFormValue = updateValue(setData);

  const content = () => {
    if (!data) {
      return (<FormLoader onRetry={loadData} errorMessage={errorMessage} />);
    }

    const validateAndSubmit = async () => {
      try {
        setFieldErrors(undefined);
        await validate(MQTT_SETTINGS_VALIDATOR, data);
        saveData();
      } catch (errors: any) {
        setFieldErrors(errors);
      }
    };

    return (
      <>
        <BlockFormControlLabel
          control={
            <Checkbox
              name="enabled"
              checked={data.enabled}
              onChange={updateFormValue}
            />
          }
          label="Activar cliente MQTT?"
        />
        <ValidatedTextField
          fieldErrors={fieldErrors}
          name="host"
          label="IP del Broker"
          fullWidth
          variant="outlined"
          value={data.host}
          onChange={updateFormValue}
          margin="normal"
        />
        <ValidatedTextField
          fieldErrors={fieldErrors}
          name="port"
          label="Puerto"
          fullWidth
          variant="outlined"
          value={numberValue(data.port)}
          type="number"
          onChange={updateFormValue}
          margin="normal"
        />
        <ValidatedTextField
          name="username"
          label="Usuario"
          fullWidth
          variant="outlined"
          value={data.username}
          onChange={updateFormValue}
          margin="normal"
        />
        <ValidatedPasswordField
          name="password"
          label="clave"
          fullWidth
          variant="outlined"
          value={data.password}
          onChange={updateFormValue}
          margin="normal"
        />
        <ValidatedTextField
          name="client_id"
          label="ID de Cliente (opcional)"
          fullWidth
          variant="outlined"
          value={data.client_id}
          onChange={updateFormValue}
          margin="normal"
        />
        <ValidatedTextField
          fieldErrors={fieldErrors}
          name="keep_alive"
          label="Keep Alive (segundos)"
          fullWidth
          variant="outlined"
          value={numberValue(data.keep_alive)}
          type="number"
          onChange={updateFormValue}
          margin="normal"
        />
        <BlockFormControlLabel
          control={
            <Checkbox
              name="clean_session"
              checked={data.clean_session}
              onChange={updateFormValue}
            />
          }
          label="Limpiar Sesión?"
        />
        <ValidatedTextField
          fieldErrors={fieldErrors}
          name="max_topic_length"
          label="Longitud Máxima de Tópico"
          fullWidth
          variant="outlined"
          value={numberValue(data.max_topic_length)}
          type="number"
          onChange={updateFormValue}
          margin="normal"
        />
        <ButtonRow mt={1}>
          <Button startIcon={<SaveIcon />} disabled={saving} variant="contained" color="primary" type="submit" onClick={validateAndSubmit}>
            Guardar
          </Button>
        </ButtonRow>
      </>
    );
  };

  return (
    <SectionContent title='Configuración MQTT' titleGutter>
      {content()}
    </SectionContent>
  );
};

export default MqttSettingsForm;
