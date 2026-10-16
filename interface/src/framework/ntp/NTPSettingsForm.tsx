import { FC, useState } from 'react';
import { ValidateFieldsError } from 'async-validator';

import { Button, Checkbox, MenuItem } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';

import * as NTPApi from "../../api/ntp";
import { NTPSettings } from '../../types';
import { BlockFormControlLabel, ButtonRow, FormLoader, SectionContent, ValidatedTextField } from '../../components';
import { validate, NTP_SETTINGS_VALIDATOR } from '../../validators';
import { updateValue, useRest } from '../../utils';

import { selectedTimeZone, timeZoneSelectItems, TIME_ZONES } from './TZ';

const NTPSettingsForm: FC = () => {
  const [fieldErrors, setFieldErrors] = useState<ValidateFieldsError>();
  const {
    loadData, saving, data, setData, saveData, errorMessage
  } = useRest<NTPSettings>({ read: NTPApi.readNTPSettings, update: NTPApi.updateNTPSettings });

  const updateFormValue = updateValue(setData);

  const content = () => {
    if (!data) {
      return (<FormLoader onRetry={loadData} errorMessage={errorMessage} />);
    }

    const validateAndSubmit = async () => {
      try {
        setFieldErrors(undefined);
        await validate(NTP_SETTINGS_VALIDATOR, data);
        saveData();
      } catch (errors: any) {
        setFieldErrors(errors);
      }
    };

    const changeTimeZone = (event: React.ChangeEvent<HTMLInputElement>) => {
      setData({
        ...data,
        tz_label: event.target.value,
        tz_format: TIME_ZONES[event.target.value]
      });
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
          label="Activar cliente NTP?"
        />
        <ValidatedTextField
          fieldErrors={fieldErrors}
          name="server"
          label="IP/Nombre del Servidor"
          fullWidth
          variant="outlined"
          value={data.server}
          onChange={updateFormValue}
          margin="normal"
        />
        <ValidatedTextField
          fieldErrors={fieldErrors}
          name="tz_label"
          label="Zona Horaria"
          fullWidth
          variant="outlined"
          value={selectedTimeZone(data.tz_label, data.tz_format)}
          onChange={changeTimeZone}
          margin="normal"
          select
        >
          <MenuItem disabled>Time zone...</MenuItem>
          {timeZoneSelectItems()}
        </ValidatedTextField>
        <ButtonRow mt={1}>
          <Button startIcon={<SaveIcon />} disabled={saving} variant="contained" color="primary" type="submit" onClick={validateAndSubmit}>
            Guardar
          </Button>
        </ButtonRow>
      </>
    );
  };

  return (
    <SectionContent title='Configurar Sistema NTP' titleGutter>
      {content()}
    </SectionContent>
  );

};

export default NTPSettingsForm;
