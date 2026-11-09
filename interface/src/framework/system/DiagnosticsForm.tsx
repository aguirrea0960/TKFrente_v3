import React, { FC, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import BugReportIcon from '@mui/icons-material/BugReport';
import MemoryIcon from '@mui/icons-material/Memory';
import WifiIcon from '@mui/icons-material/Wifi';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

import * as SystemApi from '../../api/system';
import { DiagnosticsData } from '../../types';
import { FormLoader, SectionContent } from '../../components';

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (d > 0) return `${d}d ${h}h ${m}m ${s}s`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatBytes(bytes: number): string {
  return `${(bytes / 1024).toFixed(2)} KB (${bytes.toLocaleString()} bytes)`;
}

export const DiagnosticsForm: FC = () => {
  const [data, setData] = useState<DiagnosticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDiagnostics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await SystemApi.readDiagnostics(5000);
      if (typeof res.data === 'object' && res.data && res.data.reset_reason) {
        setData(res.data);
      } else {
        setError('El firmware actual no tiene activo el endpoint /rest/diagnostics. Por favor sube el nuevo firmware.bin en la pestaña Cargar Firmware.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error cargando diagnósticos remotos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
    const interval = setInterval(fetchDiagnostics, 6000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data && !error) {
    return <FormLoader />;
  }

  const isWdtOrCrash = Boolean(
    data?.reset_reason &&
    (data.reset_reason.toLowerCase().includes('watchdog') ||
      data.reset_reason.toLowerCase().includes('exception') ||
      data.reset_reason.toLowerCase().includes('crash'))
  );

  return (
    <SectionContent title="Consola de Diagnóstico Remota">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Telemetría en vivo del ESP8266 para diagnóstico de memoria, caídas y watchdog (Actualización automática cada 6s).
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={fetchDiagnostics}
          disabled={loading}
        >
          Refrescar
        </Button>
      </Box>

      {error && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'error.dark', color: 'error.contrastText' }}>
          <Typography variant="body2">Error de comunicación: {error}</Typography>
        </Paper>
      )}

      {data && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Fila 1: Motivo de Reinicio y Memoria RAM */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {/* Tarjeta 1: Último Reinicio */}
            <Card variant="outlined" sx={{ flex: '1 1 320px', borderColor: isWdtOrCrash ? 'error.main' : 'divider' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  {isWdtOrCrash ? (
                    <WarningAmberIcon color="error" />
                  ) : (
                    <CheckCircleOutlineIcon color="success" />
                  )}
                  <Typography variant="h6">Último Reinicio</Typography>
                </Box>
                <Divider sx={{ mb: 1.5 }} />

                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Motivo reportado por Bootloader:
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={data.reset_reason}
                      color={isWdtOrCrash ? 'error' : 'success'}
                      variant="filled"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Box>
                </Box>

                <Typography variant="body2">
                  <strong>Código de reset:</strong> {data.reset_code}
                </Typography>

                {data.exccause !== undefined && data.exccause !== 0 && (
                  <Typography variant="body2" color="error.light">
                    <strong>Exception Cause:</strong> {data.exccause}
                  </Typography>
                )}
                {data.epc1 && data.epc1 !== '0x00000000' && (
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    <strong>EPC1 (Dirección Crash):</strong> {data.epc1}
                  </Typography>
                )}
                {data.excvaddr && data.excvaddr !== '0x00000000' && (
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    <strong>Excvaddr:</strong> {data.excvaddr}
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Tarjeta 2: Salud de Memoria RAM */}
            <Card variant="outlined" sx={{ flex: '1 1 320px' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <MemoryIcon color="primary" />
                  <Typography variant="h6">Salud de Memoria (RAM)</Typography>
                </Box>
                <Divider sx={{ mb: 1.5 }} />

                <Box sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">
                      <strong>Heap Libre:</strong> {formatBytes(data.free_heap)}
                    </Typography>
                    <Chip
                      size="small"
                      label={data.free_heap < 8000 ? 'CRÍTICO' : 'ESTABLE'}
                      color={data.free_heap < 8000 ? 'warning' : 'success'}
                    />
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, Math.max(0, (data.free_heap / 45000) * 100))}
                    color={data.free_heap < 8000 ? 'warning' : 'primary'}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Bloque contiguo máx:</strong> {formatBytes(data.max_free_block)}
                </Typography>
                <Typography variant="body2">
                  <strong>Fragmentación de Heap:</strong> {data.heap_fragmentation}%
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Fila 2: Conectividad y Uptime */}
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccessTimeIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Tiempo Activo (Uptime)
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {formatUptime(data.uptime)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WifiIcon color={data.wifi_connected ? 'success' : 'error'} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Señal WiFi / IP
                    </Typography>
                    <Typography variant="body1">
                      {data.wifi_connected ? `${data.wifi_rssi} dBm (${data.wifi_ip})` : 'Desconectado'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BugReportIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Frecuencia CPU
                    </Typography>
                    <Typography variant="body1">{data.cpu_freq} MHz</Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Fila 3: Registro de Eventos (Ring Buffer en RAM) */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Registro de Eventos Recientes (RAM Ring Buffer)
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                Eventos capturados en memoria volátil sin degradar la memoria flash.
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: '120px' }}><strong>Uptime</strong></TableCell>
                      <TableCell><strong>Mensaje del Evento</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.logs && data.logs.length > 0 ? (
                      data.logs.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell sx={{ fontFamily: 'monospace' }}>
                            {formatUptime(item.t)}
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'monospace' }}>
                            {item.msg}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} align="center">
                          Sin eventos registrados en el ring buffer.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}
    </SectionContent>
  );
};

export default DiagnosticsForm;
