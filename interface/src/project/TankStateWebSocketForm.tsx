import React, { FC, useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Chip, 
  Tooltip, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogContentText, 
  DialogActions, 
  Button 
} from '@mui/material';
import { 
  Droplets, 
  Home, 
  Sprout, 
  RotateCw, 
  Repeat, 
  Wifi, 
  WifiOff, 
  Radio, 
  ShieldCheck, 
  AlertTriangle, 
  Gauge, 
  SlidersHorizontal 
} from 'lucide-react';

import { WEB_SOCKET_ROOT } from '../api/endpoints';
import * as WiFiApi from '../api/wifi';
import { FormLoader, SectionContent } from '../components';
import { useWs } from '../utils';
import { TankState } from './types';

// Componentes Industriales HMI
import TankLevelIndicator from '../components/Indicators/TankLevelIndicator';
import ValveIndicator from '../components/Indicators/ValveIndicator';
import PumpIndicator from '../components/Indicators/PumpIndicator';
import PipeFlow from '../components/Indicators/PipeFlow';
import IndustrialAnnunciator from '../components/Indicators/IndustrialAnn';
import IndustrialButton from '../components/switches/IndustrialButton';

export const TANK_SETTINGS_WEBSOCKET_URL = WEB_SOCKET_ROOT + "devState";

const ESTADOS_SISTEMA = [
  { desc: "Tanque Vacío", color: "#d32f2f", icon: <AlertTriangle size={18} /> },
  { desc: "Disponible", color: "#2e7d32", icon: <ShieldCheck size={18} /> },
  { desc: "Llenando Tanque", color: "#0288d1", icon: <Droplets size={18} /> },
  { desc: "Sirviendo a Casa", color: "#0097a7", icon: <Home size={18} /> },
  { desc: "Tanque Lleno", color: "#388e3c", icon: <ShieldCheck size={18} /> },
  { desc: "Reservado", color: "#f57c00", icon: <AlertTriangle size={18} /> },
  { desc: "Recirc. 50% (Cebado)", color: "#fbc02d", icon: <RotateCw size={18} /> },
  { desc: "Recirc. 25% (Estrang.)", color: "#f57f17", icon: <Repeat size={18} /> },
  { desc: "Recirc. 50% Cerrando", color: "#fbc02d", icon: <RotateCw size={18} /> },
  { desc: "Recirc. 25% Cerrando", color: "#f57f17", icon: <Repeat size={18} /> },
];

const ESTADOS_VALVULA_SERVICIO = [
  { desc: "En Movimiento...", state: "transit" as const, color: "#ffea00" },
  { desc: "100% Abierta", state: "open" as const, color: "#39ff14" },
  { desc: "Cerrada", state: "closed" as const, color: "#ff3131" },
  { desc: "Inicializando", state: "transit" as const, color: "#ff9800" },
  { desc: "Recirculación Parcial", state: "transit" as const, color: "#00e5ff" },
];

const TankStateWebSocketForm: FC = () => {
  const { connected, updateData, data } = useWs<TankState>(TANK_SETTINGS_WEBSOCKET_URL);

  const [deviceIp, setDeviceIp] = React.useState<string>(() => {
    if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return window.location.hostname;
    }
    return '';
  });

  React.useEffect(() => {
    WiFiApi.readWiFiStatus()
      .then((res) => {
        if (res.data?.local_ip) {
          setDeviceIp(res.data.local_ip);
        }
      })
      .catch(() => {});
  }, []);

  const [confirmFillOpen, setConfirmFillOpen] = useState(false);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggle = (key: keyof TankState) => {
    if (!data) return;
    const updated = { ...data, [key]: !data[key] };
    if (key === 'cmd_rec50' && updated.cmd_rec50) {
      updated.cmd_rec25 = false;
    }
    if (key === 'cmd_rec25' && updated.cmd_rec25) {
      updated.cmd_rec50 = false;
    }
    updateData(updated);
  };

  const requestFillToggle = () => {
    if (!data) return;
    if (data.cmd_fill) {
      // Si ya está llenando, detener inmediatamente sin confirmación
      handleToggle('cmd_fill');
    } else {
      // Si va a iniciar llenado, abrir modal de confirmación y advertencia
      setConfirmFillOpen(true);
    }
  };

  const confirmFill = () => {
    setConfirmFillOpen(false);
    handleToggle('cmd_fill');
  };

  if (!connected || !data) {
    return (
      <SectionContent title="Tablero de Control SCADA" titleGutter>
        <Paper 
          sx={{ 
            p: 4, 
            textAlign: 'center', 
            borderRadius: 3, 
            background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
            color: '#fff',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
          }}
        >
          <FormLoader message="Conectando con Tanque de Frente via WebSocket (/ws/devState)..." />
        </Paper>
      </SectionContent>
    );
  }

  const currentSysState = ESTADOS_SISTEMA[data.state] || { desc: "Desconocido", color: "#777", icon: <Radio size={18} /> };
  const currentVsState = ESTADOS_VALVULA_SERVICIO[data.vs_state] || ESTADOS_VALVULA_SERVICIO[3];

  // Estado real de la Bomba de Llenado:
  const isBombaOnline = data.pump_online ?? false;
  const isBombaRunning = data.pump_running ?? false;
  const isBombaFail = data.pump_fail ?? false;

  // Permisivos lógicos:
  const canFill = data.hl_on && isBombaOnline;
  const canServe = !data.cmd_rec25 && !data.cmd_rec50;
  const canRecirc = isBombaOnline && !data.cmd_serv && data.hl_on;

  // Estados de flujo hidráulico exacto en LAZO CERRADO:
  const isSuministroActivo = data.sov1_on;
  const isSuccionBombaActiva = (data.vs_state === 1 || data.vs_state === 4) && isBombaRunning;
  const isBombaEnMarcha = isBombaRunning;
  const isServicioCasaActivo = data.cmd_serv && (data.vs_state === 1);
  const isRiegoActivo = data.sov2_on || data.cmd_rieg;

  return (
    <SectionContent title="" titleGutter>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, width: '100%', maxWidth: 1200, margin: '0 auto' }}>
        
        {/* HEADER SCADA: TELEMETRÍA EN VIVO */}
        <Paper
          elevation={4}
          sx={{
            p: 2,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box 
              sx={{ 
                p: 1, 
                borderRadius: 2, 
                bgcolor: 'rgba(56, 189, 248, 0.1)', 
                border: '1px solid rgba(56, 189, 248, 0.2)',
                color: '#38bdf8',
                display: 'flex'
              }}
            >
              <Radio size={22} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#f8fafc', letterSpacing: 0.5, fontSize: '1.1rem' }}>
                TANQUE DE FRENTE · SCADA
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                Nodo ESP32 {deviceIp ? `· IP: ${deviceIp}` : (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? `· IP: ${window.location.hostname}` : '')}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(0,0,0,0.3)', p: '6px 14px', borderRadius: 2, border: `1px solid ${currentSysState.color}` }}>
              <Box sx={{ color: currentSysState.color, display: 'flex' }}>
                {currentSysState.icon}
              </Box>
              <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem', fontFamily: 'monospace' }}>
                {currentSysState.desc.toUpperCase()}
              </Typography>
            </Box>

            <Chip
              icon={connected ? <Wifi size={14} color="#39ff14" /> : <WifiOff size={14} color="#ff3131" />}
              label={connected ? "ONLINE (WS 100ms)" : "DESCONECTADO"}
              size="small"
              sx={{
                bgcolor: connected ? 'rgba(57, 255, 20, 0.1)' : 'rgba(255, 49, 49, 0.1)',
                color: connected ? '#39ff14' : '#ff3131',
                border: `1px solid ${connected ? 'rgba(57, 255, 20, 0.3)' : 'rgba(255, 49, 49, 0.3)'}`,
                fontWeight: 700,
                fontSize: '0.75rem',
                fontFamily: 'monospace'
              }}
            />

            {/* ESTADO BOMBA DE LLENADO */}
            <Chip
              icon={isBombaOnline ? <ShieldCheck size={14} color="#39ff14" /> : <AlertTriangle size={14} color="#ff3131" />}
              label={isBombaOnline ? (isBombaRunning ? "BOMBA: MARCHA" : "BOMBA: ONLINE") : "BOMBA: OFFLINE"}
              size="small"
              sx={{
                bgcolor: isBombaOnline ? (isBombaRunning ? 'rgba(57, 255, 20, 0.15)' : 'rgba(56, 189, 248, 0.15)') : 'rgba(255, 49, 49, 0.15)',
                color: isBombaOnline ? (isBombaRunning ? '#39ff14' : '#38bdf8') : '#ff3131',
                border: `1px solid ${isBombaOnline ? (isBombaRunning ? '#39ff14' : '#38bdf8') : '#ff3131'}`,
                fontWeight: 700,
                fontSize: '0.75rem',
                fontFamily: 'monospace'
              }}
            />
          </Box>
        </Paper>

        {/* ============================================================== */}
        {/* DIAGRAMA SINÓPTICO P&ID CON LA TOPOLOGÍA HIDRÁULICA REAL      */}
        {/* ============================================================== */}
        <Paper
          elevation={4}
          sx={{
            p: 3,
            borderRadius: 3,
            background: 'linear-gradient(180deg, #131d2e 0%, #0d1522 100%)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.05), 0 10px 25px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', pb: 1 }}>
            <Typography variant="subtitle2" sx={{ color: '#38bdf8', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Gauge size={16} /> Esquema Hidráulico del Proceso (P&ID)
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontFamily: 'monospace' }}>
              SUMINISTRO → TANQUE → MV01 → SUCCIÓN BOMBA → CABEZAL DE SALIDA (CASA / RIEGO)
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around', alignItems: 'center', gap: 2 }}>
            
            {/* 1. LÍNEA DE SUMINISTRO AL TANQUE (Válvula SOV1 de Llenado) */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, bgcolor: 'rgba(255,255,255,0.02)', p: 1.5, borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
              <Typography variant="caption" sx={{ color: '#38bdf8', fontWeight: 800, textAlign: 'center' }}>
                SUMINISTRO DE AGUA
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PipeFlow 
                  flowActive={isSuministroActivo} 
                  fluidColor="#0288d1" 
                  direction="right" 
                  length={40} 
                  thickness={14} 
                />
                <ValveIndicator 
                  label="SOV1 Llenado" 
                  state={data.sov1_on ? 'open' : 'closed'} 
                  onClick={() => canFill && requestFillToggle()}
                />
                <PipeFlow 
                  flowActive={isSuministroActivo} 
                  fluidColor="#0288d1" 
                  direction="right" 
                  length={40} 
                  thickness={14} 
                />
              </Box>
              <Typography variant="caption" sx={{ color: data.sov1_on ? '#39ff14' : '#64748b', fontFamily: 'monospace', fontWeight: 'bold' }}>
                {data.sov1_on ? 'LLENANDO TANQUE' : 'CERRADA'}
              </Typography>
            </Box>

            {/* 2. EL TANQUE DE AGUA CON BOYAS */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <IndustrialAnnunciator 
                  label="BOYA HLS" 
                  state={!data.hl_on} 
                  trueText="LLENO" 
                  falseText="NORMAL" 
                  shouldPulse={!data.hl_on}
                />
              </Box>
              <TankLevelIndicator 
                level={data.level} 
                label="Tanque Frente" 
                fluidColor="#0288d1" 
              />
            </Box>

            {/* 3. SUCCIÓN DE BOMBA A TRAVÉS DE MV01 */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, bgcolor: 'rgba(255,255,255,0.02)', p: 1.5, borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
              <Typography variant="caption" sx={{ color: '#00e5ff', fontWeight: 800, textAlign: 'center' }}>
                SUCCIÓN BOMBA (VÍA MV01)
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PipeFlow 
                  flowActive={isSuccionBombaActiva} 
                  fluidColor="#00e5ff" 
                  direction="right" 
                  length={35} 
                  thickness={14} 
                />
                <ValveIndicator 
                  label="MV01 Servicio" 
                  state={currentVsState.state} 
                  onClick={() => canServe && handleToggle('cmd_serv')}
                />
                <PipeFlow 
                  flowActive={isSuccionBombaActiva} 
                  fluidColor="#00e5ff" 
                  direction="right" 
                  length={35} 
                  thickness={14} 
                />
                <PumpIndicator 
                  label="BOMBA TK" 
                  state={isBombaEnMarcha ? 'running' : 'stopped'} 
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                <Typography variant="caption" sx={{ color: currentVsState.color, fontFamily: 'monospace', fontWeight: 'bold' }}>
                  MV01: {currentVsState.desc.toUpperCase()} ({data.time_vsoper}s)
                </Typography>
                <Typography variant="caption" sx={{ color: isBombaEnMarcha ? '#39ff14' : (data.cmd_serv ? (isBombaOnline ? '#fbbf24' : '#ff3131') : '#64748b'), fontFamily: 'monospace', fontWeight: 'bold' }}>
                  BOMBA: {isBombaEnMarcha ? 'MARCHA' : (data.cmd_serv ? (isBombaOnline ? 'ALINEANDO...' : 'OFFLINE') : 'PARADA')}
                </Typography>
              </Box>
            </Box>

            {/* 4. CABEZAL DE SALIDA DE BOMBA: CASA Y SOV2 RIEGO */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, bgcolor: 'rgba(255,255,255,0.02)', p: 1.5, borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
              <Typography variant="caption" sx={{ color: '#34d399', fontWeight: 800, textAlign: 'center' }}>
                CABEZAL DE DISTRIBUCIÓN
              </Typography>
              
              {/* Salida a Casa */}
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>
                  A CASA:
                </Typography>
                <PipeFlow 
                  flowActive={isServicioCasaActivo} 
                  fluidColor="#00e5ff" 
                  direction="right" 
                  length={60} 
                  thickness={12} 
                />
                <Chip 
                  label={isServicioCasaActivo ? "SUMINISTRANDO" : "CERRADO"} 
                  size="small"
                  sx={{ 
                    bgcolor: isServicioCasaActivo ? 'rgba(57,255,20,0.1)' : 'rgba(255,255,255,0.05)', 
                    color: isServicioCasaActivo ? '#39ff14' : '#64748b',
                    fontSize: '9px',
                    fontWeight: 700,
                    fontFamily: 'monospace'
                  }} 
                />
              </Box>

              {/* Salida a Riego (SOV2) */}
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>
                  A RIEGO:
                </Typography>
                <PipeFlow 
                  flowActive={isRiegoActivo} 
                  fluidColor="#10b981" 
                  direction="right" 
                  length={35} 
                  thickness={12} 
                />
                <ValveIndicator 
                  label="SOV2 Riego" 
                  state={data.sov2_on ? 'open' : 'closed'} 
                  onClick={() => handleToggle('cmd_rieg')}
                />
              </Box>
              <Typography variant="caption" sx={{ color: data.sov2_on ? '#10b981' : '#64748b', fontFamily: 'monospace', fontWeight: 'bold' }}>
                {data.sov2_on ? `REGANDO (${formatTimer(data.time_rem)})` : 'RIEGO APAGADO'}
              </Typography>
            </Box>

          </Box>
        </Paper>

        {/* ============================================================== */}
        {/* CONSOLA DE ACCIONES Y MANDOS INDUSTRIALES                     */}
        {/* ============================================================== */}
        <Paper
          elevation={4}
          sx={{
            p: 3,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.4)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, pb: 1, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <SlidersHorizontal size={18} color="#38bdf8" />
            <Typography variant="subtitle2" sx={{ color: '#f8fafc', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' }}>
              Consola de Comandos y Maniobra (HMI 3.0)
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 3 }}>
            
            {/* Llenar Tanque (SOV1) */}
            <Tooltip title={!isBombaOnline ? "Bloqueado: Bomba apagada por Smart Plug (Offline)" : (!canFill ? "Bloqueado: Boya HLS indica tanque lleno" : "Abrir válvula SOV1 de suministro")}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <IndustrialButton 
                  label="Llenar Tanque"
                  color="blue"
                  onClick={requestFillToggle}
                  disabled={!canFill}
                />
                <Box sx={{ mt: 1, textAlign: 'center' }}>
                  <Chip 
                    label={data.cmd_fill ? "EN LLENADO" : "DETENIDO"} 
                    size="small" 
                    sx={{ 
                      bgcolor: data.cmd_fill ? '#0288d1' : '#334155', 
                      color: '#fff', 
                      fontWeight: 700, 
                      fontSize: '9px',
                      fontFamily: 'monospace'
                    }} 
                  />
                </Box>
              </Box>
            </Tooltip>

            {/* Servir Agua a la Casa (MV01) */}
            <Tooltip title={!canServe ? "Bloqueado: Recirculación activa" : "Abre MV01 para suministrar agua a la vivienda"}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <IndustrialButton 
                  label="Servir Agua"
                  color="green"
                  onClick={() => handleToggle('cmd_serv')}
                  disabled={!canServe}
                />
                <Box sx={{ mt: 1, textAlign: 'center' }}>
                  <Chip 
                    label={data.cmd_serv ? (data.vs_state === 1 ? "SIRVIENDO" : "ABRIENDO...") : "CERRADO"} 
                    size="small" 
                    sx={{ 
                      bgcolor: data.cmd_serv ? (data.vs_state === 1 ? '#2e7d32' : '#f59e0b') : '#334155', 
                      color: '#fff', 
                      fontWeight: 700, 
                      fontSize: '9px',
                      fontFamily: 'monospace'
                    }} 
                  />
                </Box>
              </Box>
            </Tooltip>

            {/* Regar Jardín (SOV2 en cabezal) */}
            <Tooltip title="Activar riego temporizado mediante solenoide SOV2 en cabezal de bomba">
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <IndustrialButton 
                  label="Regar Jardín"
                  color="green"
                  onClick={() => handleToggle('cmd_rieg')}
                />
                <Box sx={{ mt: 1, textAlign: 'center' }}>
                  <Chip 
                    label={data.cmd_rieg ? "REGANDO" : "APAGADO"} 
                    size="small" 
                    sx={{ 
                      bgcolor: data.cmd_rieg ? '#10b981' : '#334155', 
                      color: '#fff', 
                      fontWeight: 700, 
                      fontSize: '9px',
                      fontFamily: 'monospace'
                    }} 
                  />
                </Box>
              </Box>
            </Tooltip>

            {/* Recirculación 50% */}
            <Tooltip title={!canRecirc ? "Bloqueado: Verifique que la bomba esté Online y tanque con agua" : "Cebado inicial: Abre MV01 al 50% para arrastrar agua de calle"}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <IndustrialButton 
                  label="Recircular 50%"
                  color="blue"
                  onClick={() => handleToggle('cmd_rec50')}
                  disabled={!canRecirc}
                />
                <Box sx={{ mt: 1, textAlign: 'center' }}>
                  <Chip 
                    label={data.cmd_rec50 ? "RECIRC 50%" : "INACTIVO"} 
                    size="small" 
                    sx={{ 
                      bgcolor: data.cmd_rec50 ? '#f59e0b' : '#334155', 
                      color: '#fff', 
                      fontWeight: 700, 
                      fontSize: '9px',
                      fontFamily: 'monospace'
                    }} 
                  />
                </Box>
              </Box>
            </Tooltip>

            {/* Recirculación 25% */}
            <Tooltip title={!canRecirc ? "Bloqueado: Verifique que la bomba esté Online y tanque con agua" : "Estrangulamiento: MV01 al 25% para inducir vacío y arrastrar agua de calle"}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <IndustrialButton 
                  label="Recircular 25%"
                  color="blue"
                  onClick={() => handleToggle('cmd_rec25')}
                  disabled={!canRecirc}
                />
                <Box sx={{ mt: 1, textAlign: 'center' }}>
                  <Chip 
                    label={data.cmd_rec25 ? "RECIRC 25%" : "INACTIVO"} 
                    size="small" 
                    sx={{ 
                      bgcolor: data.cmd_rec25 ? '#d97706' : '#334155', 
                      color: '#fff', 
                      fontWeight: 700, 
                      fontSize: '9px',
                      fontFamily: 'monospace'
                    }} 
                  />
                </Box>
              </Box>
            </Tooltip>

          </Box>
        </Paper>

        {/* DIÁLOGO MODAL DE CONFIRMACIÓN DE LLENADO */}
        <Dialog
          open={confirmFillOpen}
          onClose={() => setConfirmFillOpen(false)}
          PaperProps={{
            sx: {
              bgcolor: '#0f172a',
              color: '#f8fafc',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: 3,
              p: 1
            }
          }}
        >
          <DialogTitle sx={{ color: '#38bdf8', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AlertTriangle color="#f59e0b" size={24} /> Confirmar Inicio de Llenado
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: '#cbd5e1', mb: 2 }}>
              Está a punto de abrir la electroválvula <strong>SOV1</strong> para llenar el Tanque del Frente.
            </DialogContentText>
            <Box sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', p: 1.5, borderRadius: 2, mb: 1.5 }}>
              <Typography variant="body2" sx={{ color: '#fbbf24', fontWeight: 700, mb: 0.5 }}>
                ⚠️ Advertencia de Seguridad Hidráulica:
              </Typography>
              <Typography variant="caption" sx={{ color: '#e2e8f0', display: 'block' }}>
                • Verifique que la red pública esté alineada con agua de calle.<br />
                • Verifique que la bomba de llenado esté encendida.<br />
                • Si la bomba está apagada, la presión hidrostática del tanque del techo podría vaciar el techo por gravedad hacia el frente.
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              El sistema cuenta con corte automático de emergencia por Watchdog a los 40 minutos.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setConfirmFillOpen(false)} sx={{ color: '#94a3b8' }}>
              Cancelar
            </Button>
            <Button 
              onClick={confirmFill} 
              variant="contained" 
              sx={{ bgcolor: '#0288d1', '&:hover': { bgcolor: '#0277bd' }, fontWeight: 700 }}
            >
              Confirmar e Iniciar Llenado
            </Button>
          </DialogActions>
        </Dialog>

      </Box>
    </SectionContent>
  );
};

export default TankStateWebSocketForm;
