import React, { FC, useState } from "react";
import { ValidateFieldsError } from "async-validator";
import { 
  Box, 
  Button, 
  TextField, 
  Checkbox, 
  Paper, 
  Typography, 
  Divider 
} from "@mui/material";
import { 
  Save, 
  Sliders, 
  Clock, 
  ShieldCheck, 
  Server, 
  Gauge 
} from "lucide-react";

import { 
  ButtonRow, 
  FormLoader, 
  SectionContent, 
  ValidatedTextField, 
  BlockFormControlLabel 
} from "../components";
import { validate } from "../validators";
import { numberValue, useRest, updateValue } from "../utils";

import * as DemoApi from './api';
import { TankSettings } from "./types";
import { TANK_SETTINGS_VALIDATOR } from "./validators";

const TankSettingsForm: FC = () => {
  const [fieldErrors, setFieldErrors] = useState<ValidateFieldsError>();
  const {
    loadData, saveData, saving, setData, data, errorMessage
  } = useRest<TankSettings>({ read: DemoApi.readTankSettings, update: DemoApi.updateTankSettings });

  const updateFormValue = updateValue(setData);

  if (!data) {
    return (
      <SectionContent title="Configuración de Parámetros del Sistema" titleGutter>
        <FormLoader onRetry={loadData} errorMessage={errorMessage} />
      </SectionContent>
    );
  }

  const validateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFieldErrors(undefined);
      await validate(TANK_SETTINGS_VALIDATOR, data);
      saveData();
    } catch (errors: any) {
      setFieldErrors(errors);
    }
  };

  return (
    <SectionContent title="" titleGutter>
      <Box 
        component="form" 
        onSubmit={validateAndSubmit} 
        sx={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 3 }}
      >
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
            <Sliders size={22} color="#38bdf8" />
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 0.5 }}>
              PARÁMETROS OPERATIVOS DEL TANQUE
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
            Ajuste los límites de nivel ultrasónico, tiempos de maniobra de válvula motorizada e integración de la bomba asociada.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* SECCIÓN 1: CALIBRACIÓN DE NIVEL */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Gauge size={18} color="#00e5ff" />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#38bdf8' }}>
                  CALIBRACIÓN DE SENSOR ULTRASÓNICO (AJ-SR04M)
                </Typography>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <ValidatedTextField
                  fieldErrors={fieldErrors}
                  name="level_min"
                  label="Distancia Nivel Mínimo 0% (CMS)"
                  fullWidth
                  variant="outlined"
                  value={numberValue(data.level_min)}
                  type="number"
                  onChange={updateFormValue}
                  helperText="Distancia medida cuando el tanque está en fondo/reserva mínima"
                />
                <ValidatedTextField
                  fieldErrors={fieldErrors}
                  name="level_max"
                  label="Distancia Nivel Máximo 100% (CMS)"
                  fullWidth
                  variant="outlined"
                  value={numberValue(data.level_max)}
                  type="number"
                  onChange={updateFormValue}
                  helperText="Distancia medida hasta el espejo de agua con tanque lleno"
                />
              </Box>
            </Box>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

            {/* SECCIÓN 2: VÁLVULA MOTORIZADA DE SERVICIO (MV01) */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Clock size={18} color="#f59e0b" />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f59e0b' }}>
                  TIEMPOS DE OPERACIÓN DE VÁLVULA MOTORIZADA (SEGUNDOS)
                </Typography>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
                <TextField
                  name="vs_toper"
                  label="Tiempo Total Maniobra 100% (s)"
                  fullWidth
                  variant="outlined"
                  value={numberValue(data.vs_toper)}
                  type="number"
                  onChange={updateFormValue}
                  helperText="Tiempo de apertura/cierre completo"
                />
                <TextField
                  name="vs_topen50"
                  label="Tiempo Apertura al 50% (s)"
                  fullWidth
                  variant="outlined"
                  value={numberValue(data.vs_topen50)}
                  type="number"
                  onChange={updateFormValue}
                  helperText="Cebado Etapa 1"
                />
                <TextField
                  name="vs_topen25"
                  label="Tiempo Apertura al 25% (s)"
                  fullWidth
                  variant="outlined"
                  value={numberValue(data.vs_topen25)}
                  type="number"
                  onChange={updateFormValue}
                  helperText="Estrangulamiento Etapa 2"
                />
              </Box>
            </Box>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

            {/* SECCIÓN 3: RIEGO Y SENSORES DISCRETOS */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <ShieldCheck size={18} color="#10b981" />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#10b981' }}>
                  RIEGO DE JARDÍN Y POLARIDAD DE BOYAS
                </Typography>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField
                  name="rieg_time"
                  label="Tiempo de Riego por Defecto (Minutos)"
                  fullWidth
                  variant="outlined"
                  value={numberValue(data.rieg_time)}
                  type="number"
                  onChange={updateFormValue}
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <BlockFormControlLabel
                    control={
                      <Checkbox
                        name="hls_invert"
                        checked={data.hls_invert}
                        onChange={updateFormValue}
                      />
                    }
                    label="Invertir Lógica de Boya Alto Nivel (HLS)"
                  />
                </Box>
              </Box>
            </Box>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

            {/* SECCIÓN 4: INTEGRACIÓN BOMBA ASOCIADA */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Server size={18} color="#a855f7" />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#a855f7' }}>
                  ENLACE CON BOMBA ASOCIADA (ARRANQUE AUTOMÁTICO EN SERVICIO)
                </Typography>
              </Box>
              <TextField
                name="pump_host"
                label="Dirección IP o Host de la Bomba Asociada"
                fullWidth
                variant="outlined"
                value={data.pump_host || ''}
                type="text"
                onChange={updateFormValue}
                helperText="Host objetivo para emitir POST /rest/devState (Por defecto: 192.168.10.191)"
              />
            </Box>

          </Box>

          <ButtonRow mt={4}>
            <Button 
              startIcon={<Save size={18} />} 
              disabled={saving} 
              variant="contained" 
              color="primary" 
              type="submit"
              size="large"
              sx={{ px: 4, py: 1.2, fontWeight: 700, borderRadius: 2 }}
            >
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </ButtonRow>
        </Paper>
      </Box>
    </SectionContent>
  );
};

export default TankSettingsForm;
