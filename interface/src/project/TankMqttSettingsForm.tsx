import React, { FC, useState } from "react";
import { ValidateFieldsError } from "async-validator";
import { Box, Button, TextField, Paper, Typography } from "@mui/material";
import { Save, Radio } from "lucide-react";

import { ButtonRow, FormLoader, SectionContent, ValidatedTextField } from "../components";
import { validate } from "../validators";
import { useRest, updateValue } from "../utils";

import * as DemoApi from './api';
import { TankMqttSettings } from "./types";
import { TANK_MQTT_SETTINGS_VALIDATOR } from "./validators";

const TankMqttSettingsForm: FC = () => {
  const [fieldErrors, setFieldErrors] = useState<ValidateFieldsError>();
  const {
    loadData, saveData, saving, setData, data, errorMessage
  } = useRest<TankMqttSettings>({ read: DemoApi.readBrokerSettings, update: DemoApi.updateBrokerSettings });

  const updateFormValue = updateValue(setData);

  if (!data) {
    return (
      <SectionContent title="Configuración de Telemetría MQTT" titleGutter>
        <FormLoader onRetry={loadData} errorMessage={errorMessage} />
      </SectionContent>
    );
  }

  const validateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFieldErrors(undefined);
      await validate(TANK_MQTT_SETTINGS_VALIDATOR, data);
      saveData();
    } catch (errors: any) {
      setFieldErrors(errors);
    }
  };

  return (
    <SectionContent title="" titleGutter>
      <Box component="form" onSubmit={validateAndSubmit} sx={{ maxWidth: 800, margin: '0 auto' }}>
        <Paper
          elevation={3}
          sx={{
            p: 3,
            borderRadius: 3,
            background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#f8fafc'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Radio size={22} color="#38bdf8" />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              CONFIGURACIÓN MQTT & TELEMETRÍA
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
            Rutas de publicación y subscripción para integración con Home Assistant, Node-RED o Broker central.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <ValidatedTextField
              fieldErrors={fieldErrors}
              name="name"
              label="Nombre Descriptivo del Tanque"
              fullWidth
              variant="outlined"
              value={data.name || ''}
              onChange={updateFormValue}
            />

            <TextField
              name="unique_id"
              label="Identificador Único (Unique ID)"
              fullWidth
              variant="outlined"
              value={data.unique_id || ''}
              onChange={updateFormValue}
            />

            <ValidatedTextField
              fieldErrors={fieldErrors}
              name="mqtt_path"
              label="Ruta Base de Topic MQTT (Tanque)"
              fullWidth
              variant="outlined"
              value={data.mqtt_path || ''}
              onChange={updateFormValue}
              helperText="Ejemplo: home/water/tank_frente"
            />

            <TextField
              name="pump_path"
              label="Ruta de Topic MQTT de la Bomba Asociada"
              fullWidth
              variant="outlined"
              value={data.pump_path || ''}
              onChange={updateFormValue}
              helperText="Ejemplo: home/water/pump"
            />
          </Box>

          <ButtonRow mt={3}>
            <Button 
              startIcon={<Save size={18} />} 
              disabled={saving} 
              variant="contained" 
              color="primary" 
              type="submit"
              size="large"
              sx={{ px: 4, py: 1.2, fontWeight: 700, borderRadius: 2 }}
            >
              {saving ? "Guardando..." : "Guardar Configuración MQTT"}
            </Button>
          </ButtonRow>
        </Paper>
      </Box>
    </SectionContent>
  );
};

export default TankMqttSettingsForm;
