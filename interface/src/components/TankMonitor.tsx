import React, { FC, useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  Box, Typography, Paper, Button, Chip, Alert, Tooltip, IconButton
} from '@mui/material';
import {
  Radio, Droplets, AlertTriangle,
  CheckCircle2, RefreshCw, ShieldAlert, Building2, SlidersHorizontal, ExternalLink
} from 'lucide-react';

import { useThemeMode } from '../CustomTheme';
import { useWs } from '../utils';
import TankLevelIndicator from './Indicators/TankLevelIndicator';

export interface TankTelemetryState {
  level: number;       // Nivel actual en % (0 - 100)
  hl_on: boolean;      // Sensor de Alto Nivel / Tope HLS (Normalmente cerrado / False = Agua en tope)
  ll_on?: boolean;     // Sensor de Reposición LLS (opcional si existe boya física)
  cmd_fill: boolean;   // Comando de llenado solicitado
  sov1_on: boolean;    // Estado de activación física de la electroválvula solenoide SOV01
  state: number;       // Código de estado operativo del tanque
  time_rem?: number;   // Tiempo de timeout restante (si aplica)
}

export interface TankMonitorProps {
  // Identificación y Conexión
  title: string;
  host: string;
  deviceDescription?: string;

  // Llenado y Enclavamiento Obligatorio (HLS <-> SOV01)
  hasFillingValve?: boolean;
  allowFillControl?: boolean;

  // Sensor Físico de Nivel Mínimo (Opcional)
  hasLls?: boolean;

  // Umbral de Nivel Mínimo por Software (Reserva de Recirculación sin perforar el tanque)
  enableSoftMinLevel?: boolean;
  softMinLevelThreshold?: number;

  // Look & Feel
  themeMode?: 'dark' | 'light' | 'auto';
}

const ESTADOS_SISTEMA: Record<number, { desc: string; color: string; icon: string }> = {
  0: { desc: 'Depósito Vacío', color: '#ef4444', icon: '🔴' },
  1: { desc: 'En Espera / Disponible', color: '#10b981', icon: '🟢' },
  2: { desc: 'Llenando Depósito', color: '#38bdf8', icon: '💧' },
  3: { desc: 'En Servicio', color: '#6366f1', icon: '⚡' },
  4: { desc: 'Depósito Lleno (100%)', color: '#3b82f6', icon: '🔵' },
  5: { desc: 'Falla en Sensor / Boya', color: '#f59e0b', icon: '⚠️' },
};

export const TankMonitor: FC<TankMonitorProps> = ({
  title,
  host,
  deviceDescription,
  hasFillingValve = true,
  allowFillControl = true,
  hasLls = false,
  enableSoftMinLevel = false,
  softMinLevelThreshold = 25,
  themeMode = 'auto'
}) => {
  const { mode } = useThemeMode();
  const isDark = themeMode === 'auto' ? mode === 'dark' : themeMode === 'dark';

  const cleanHost = host.trim().replace(/^http:\/\/|^ws:\/\/|\/$/g, '') || window.location.host;
  const httpUrl = `http://${cleanHost}/rest/devState`;
  const wsUrl = `ws://${cleanHost}/ws/devState`;

  const [restData, setRestData] = useState<TankTelemetryState | null>(null);
  const [restOnline, setRestOnline] = useState<boolean>(false);
  const [cmdPending, setCmdPending] = useState<boolean>(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const { connected: wsConnected, updateData, data: wsData } = useWs<TankTelemetryState>(wsUrl);

  useEffect(() => {
    let active = true;
    const fetchState = () => {
      axios.get<TankTelemetryState>(httpUrl, { timeout: 3500 })
        .then(res => {
          if (active && res.data && typeof res.data.level === 'number') {
            setRestData(res.data);
            setRestOnline(true);
            setLastError(null);
          }
        })
        .catch(() => {
          if (active) setRestOnline(false);
        });
    };

    fetchState();
    const timer = setInterval(fetchState, 2500);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [httpUrl]);

  const data = wsData || restData;
  const connected = wsConnected || restOnline;

  const handleCommandFill = async (desiredFillState: boolean) => {
    if (!data || cmdPending) return;
    setCmdPending(true);
    setLastError(null);

    const updated = { ...data, cmd_fill: desiredFillState };
    updateData(updated);

    try {
      await axios.post<TankTelemetryState>(httpUrl, updated);
    } catch (e: any) {
      setLastError(`Error al enviar comando: ${e.message}`);
    } finally {
      setCmdPending(false);
    }
  };

  const isFull = useMemo(() => {
    if (!data) return false;
    return !data.hl_on || (data.level >= 98);
  }, [data]);

  const isLowBySoftware = useMemo(() => {
    if (!data || !enableSoftMinLevel) return false;
    return data.level <= softMinLevelThreshold;
  }, [data, enableSoftMinLevel, softMinLevelThreshold]);

  const isLowByHardware = useMemo(() => {
    if (!data || !hasLls) return false;
    return Boolean(data.ll_on);
  }, [data, hasLls]);

  const isRefillRequested = isLowByHardware || isLowBySoftware;

  useEffect(() => {
    if (data?.cmd_fill && isFull && !cmdPending) {
      console.warn(`[TankMonitor - ${title}] Interlock HLS en tope: cortando llenado.`);
      handleCommandFill(false);
    }
  }, [data?.cmd_fill, isFull]);

  const currentSysState = useMemo(() => {
    if (!data) return ESTADOS_SISTEMA[1];
    return ESTADOS_SISTEMA[data.state] || { desc: `Estado (${data.state})`, color: isDark ? '#94a3b8' : '#64748b', icon: '⚪' };
  }, [data, isDark]);

  if (!data) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 4,
          textAlign: 'center',
          borderRadius: 3,
          background: isDark ? 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)' : '#ffffff',
          boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)',
          border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
          color: isDark ? '#f8fafc' : '#0f172a'
        }}
      >
        <RefreshCw size={36} className="animate-spin" style={{ margin: '0 auto 16px', color: '#0284c7' }} />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Conectando con {title}...</Typography>
        <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', mt: 1 }}>
          Estableciendo telemetría con {cleanHost}
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* 1. CABECERA PRINCIPAL SCADA */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 3,
          background: isDark ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' : '#ffffff',
          boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.06)',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2.5,
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#fff',
              display: 'flex',
              boxShadow: '0 0 20px rgba(2, 132, 199, 0.4)'
            }}
          >
            <Building2 size={26} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a', letterSpacing: 0.5, fontSize: '1.15rem' }}>
              {title.toUpperCase()}
            </Typography>
            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {deviceDescription || `Nodo Remoto - IP: ${cleanHost}`}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: isDark ? 'rgba(0,0,0,0.3)' : '#f8fafc', p: '6px 14px', borderRadius: 2, border: `1px solid ${currentSysState.color}` }}>
            <span style={{ fontSize: '0.85rem' }}>{currentSysState.icon}</span>
            <Typography variant="body2" sx={{ fontWeight: 700, color: currentSysState.color }}>
              {currentSysState.desc}
            </Typography>
          </Box>

          <Chip
            icon={<Radio size={14} />}
            label={connected ? (wsConnected ? "WS ONLINE" : "REST SYNC") : "DESCONECTADO"}
            size="small"
            sx={{
              bgcolor: connected ? (isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)') : (isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)'),
              color: connected ? '#10b981' : '#ef4444',
              fontWeight: 700,
              border: `1px solid ${connected ? '#10b981' : '#ef4444'}`
            }}
          />

          <Tooltip title={`Abrir Panel Web Nativo del Tanque (http://${cleanHost})`}>
            <IconButton
              component="a"
              href={`http://${cleanHost}`}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              sx={{
                bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #cbd5e1',
                color: isDark ? '#94a3b8' : '#475569',
                '&:hover': {
                  bgcolor: '#0284c7',
                  color: '#fff'
                }
              }}
            >
              <ExternalLink size={16} />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {lastError && (
        <Alert severity="error" onClose={() => setLastError(null)} sx={{ borderRadius: 2 }}>
          {lastError}
        </Alert>
      )}

      {/* 2. CUERPO: REGLA DE NIVEL + COLUMNA DE SENSORES Y MANDOS */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '340px 1fr' },
          gap: 3,
          alignItems: 'start'
        }}
      >
        {/* COLUMNA IZQUIERDA: REGLA HIDROSTÁTICA */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            background: isDark ? 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)' : '#ffffff',
            boxShadow: isDark ? '0 8px 30px rgba(0,0,0,0.35)' : '0 4px 20px rgba(0,0,0,0.06)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#94a3b8' : '#64748b', letterSpacing: 1, textTransform: 'uppercase', mb: 2 }}>
            Nivel Hidrostático
          </Typography>

          <Box sx={{ my: 1, width: '100%', display: 'flex', justifyContent: 'center' }}>
            <TankLevelIndicator
              level={data.level}
              label={title}
            />
          </Box>

          <Box sx={{ mt: 2, textAlign: 'center', width: '100%', bgcolor: isDark ? 'rgba(0,0,0,0.25)' : '#f8fafc', p: 1.5, borderRadius: 2, border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.06)' }}>
            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', display: 'block' }}>Lectura Ultrasónica / Hidráulica</Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#0284c7' }}>
              {data.level.toFixed(1)} %
            </Typography>
          </Box>

          {/* Marcador de Reserva Mínima configurado por Software */}
          {enableSoftMinLevel && (
            <Box sx={{ mt: 1.5, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, p: 1, borderRadius: 1.5, bgcolor: isLowBySoftware ? 'rgba(245, 158, 11, 0.1)' : 'transparent', border: isLowBySoftware ? '1px dashed #f59e0b' : 'none' }}>
              <SlidersHorizontal size={14} color={isLowBySoftware ? '#f59e0b' : '#64748b'} />
              <Typography variant="caption" sx={{ color: isLowBySoftware ? '#f59e0b' : (isDark ? '#94a3b8' : '#64748b'), fontWeight: isLowBySoftware ? 800 : 500 }}>
                Reserva Mínima Recirculación: <strong>{softMinLevelThreshold}%</strong> {isLowBySoftware && "(¡Alcanzada!)"}
              </Typography>
            </Box>
          )}
        </Paper>

        {/* COLUMNA DERECHA: SENSORES DE SEGURIDAD Y MANDO DE LLENADO */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

          {/* TARJETA 1: SENSORES DE SEGURIDAD (HLS + LLS / RESERVA) */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              background: isDark ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : '#ffffff',
              boxShadow: isDark ? '0 8px 30px rgba(0,0,0,0.35)' : '0 4px 20px rgba(0,0,0,0.06)',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
              <ShieldAlert size={20} color="#0284c7" />
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a', letterSpacing: 0.5 }}>
                SENSORES DISCRETOS DE SEGURIDAD
              </Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: (hasLls || enableSoftMinLevel) ? { xs: '1fr', sm: '1fr 1fr' } : '1fr', gap: 2 }}>

              {/* Boya Alto Nivel (HLS) - OBLIGATORIA */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  bgcolor: isFull ? (isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)') : (isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.08)'),
                  border: `1px solid ${isFull ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.25)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}
              >
                <Box
                  sx={{
                    p: 1.2,
                    borderRadius: 2,
                    bgcolor: isFull ? '#ef4444' : '#10b981',
                    color: '#fff',
                    display: 'flex',
                    boxShadow: isFull ? '0 0 15px rgba(239, 68, 68, 0.5)' : '0 0 15px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  {isFull ? <AlertTriangle size={22} /> : <CheckCircle2 size={22} />}
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>BOYA DE ALTO NIVEL (HLS)</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 800, color: isFull ? '#ef4444' : '#10b981' }}>
                    {isFull ? 'DEPÓSITO LLENO / TOPE' : 'NORMAL (ESPACIO LIBRE)'}
                  </Typography>
                </Box>
              </Paper>

              {/* Nivel Mínimo: Boya Física (LLS) o Software Inteligente */}
              {(hasLls || enableSoftMinLevel) && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    bgcolor: isRefillRequested ? (isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)') : (isDark ? 'rgba(2, 132, 199, 0.1)' : 'rgba(2, 132, 199, 0.08)'),
                    border: `1px solid ${isRefillRequested ? 'rgba(245, 158, 11, 0.35)' : 'rgba(2, 132, 199, 0.25)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                  }}
                >
                  <Box
                    sx={{
                      p: 1.2,
                      borderRadius: 2,
                      bgcolor: isRefillRequested ? '#f59e0b' : '#0284c7',
                      color: '#fff',
                      display: 'flex',
                      boxShadow: isRefillRequested ? '0 0 15px rgba(245, 158, 11, 0.5)' : '0 0 15px rgba(2, 132, 199, 0.3)'
                    }}
                  >
                    {isRefillRequested ? <AlertTriangle size={22} /> : <CheckCircle2 size={22} />}
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                      {hasLls ? 'BOYA REPOSICIÓN (LLS)' : `RESERVA MÍNIMA (≤ ${softMinLevelThreshold}%)`}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 800, color: isRefillRequested ? '#f59e0b' : '#0284c7' }}>
                      {isRefillRequested ? 'SOLICITANDO REPOSICIÓN' : 'NIVEL SATISFACTORIO'}
                    </Typography>
                  </Box>
                </Paper>
              )}
            </Box>
          </Paper>

          {/* TARJETA 2: MANDO DE LLENADO Y TRASVASE (SOV01) */}
          {hasFillingValve && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                background: isDark ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : '#ffffff',
                boxShadow: isDark ? '0 8px 30px rgba(0,0,0,0.35)' : '0 4px 20px rgba(0,0,0,0.06)',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Droplets size={20} color="#0284c7" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a', letterSpacing: 0.5 }}>
                    MANDO DE LLENADO Y TRASVASE
                  </Typography>
                </Box>

                <Chip
                  label={data.sov1_on ? "SOLENOIDE ACTIVA" : "SOLENOIDE CERRADA"}
                  size="small"
                  sx={{
                    bgcolor: data.sov1_on ? (isDark ? 'rgba(2, 132, 199, 0.2)' : 'rgba(2, 132, 199, 0.1)') : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                    color: data.sov1_on ? '#0284c7' : (isDark ? '#94a3b8' : '#64748b'),
                    fontWeight: 700,
                    border: `1px solid ${data.sov1_on ? '#0284c7' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')}`
                  }}
                />
              </Box>

              {isFull && (
                <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                  El depósito se encuentra a su capacidad máxima (100% / Boya de tope activada). El llenado automático está bloqueado por protección contra rebase.
                </Alert>
              )}

              {allowFillControl && (
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={cmdPending || (isFull && !data.cmd_fill)}
                  onClick={() => handleCommandFill(!data.cmd_fill)}
                  startIcon={<Droplets size={20} />}
                  sx={{
                    py: 1.5,
                    borderRadius: 2.5,
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    letterSpacing: 0.5,
                    background: data.cmd_fill
                      ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                      : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    boxShadow: data.cmd_fill
                      ? '0 4px 15px rgba(239, 68, 68, 0.4)'
                      : '0 4px 15px rgba(2, 132, 199, 0.4)',
                    '&:hover': {
                      background: data.cmd_fill
                        ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
                        : 'linear-gradient(135deg, #0369a1 0%, #075985 100%)'
                    }
                  }}
                >
                  {data.cmd_fill ? `DETENER LLENADO DE ${title.toUpperCase()}` : `INICIAR LLENADO DE ${title.toUpperCase()}`}
                </Button>
              )}
            </Paper>
          )}

        </Box>
      </Box>
    </Box>
  );
};

export default TankMonitor;
