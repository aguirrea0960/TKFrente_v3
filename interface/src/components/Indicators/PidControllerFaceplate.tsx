import React, { useState } from 'react';
import { Box, Paper, Typography, Button, Switch, FormControlLabel, Slider, TextField, Collapse } from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';

interface PidControllerFaceplateProps {
  label: string;
  pv: number; // Process Variable (0 to 100%)
  sp: number; // Setpoint (0 to 100%)
  cv: number; // Control Variable / Output (0 to 100%)
  mode: 'auto' | 'manual';
  onSpChange: (value: number) => void;
  onCvChange: (value: number) => void;
  onModeChange: (mode: 'auto' | 'manual') => void;
  kp: number;
  ki: number;
  kd: number;
  onTuningChange: (kp: number, ki: number, kd: number) => void;
}

export const PidControllerFaceplate: React.FC<PidControllerFaceplateProps> = ({
  label,
  pv,
  sp,
  cv,
  mode,
  onSpChange,
  onCvChange,
  onModeChange,
  kp,
  ki,
  kd,
  onTuningChange
}) => {
  const [showTuning, setShowTuning] = useState(false);
  const [localKp, setLocalKp] = useState(kp);
  const [localKi, setLocalKi] = useState(ki);
  const [localKd, setLocalKd] = useState(kd);

  const handleApplyTuning = () => {
    onTuningChange(localKp, localKi, localKd);
  };

  return (
    <Paper
      elevation={4}
      style={{
        padding: '16px',
        backgroundColor: '#e0e0e0',
        border: '2px solid #999',
        borderRadius: '6px',
        width: '280px',
        boxSizing: 'border-box',
        fontFamily: 'monospace',
        userSelect: 'none'
      }}
    >
      {/* Title */}
      <Typography
        variant="subtitle2"
        style={{
          fontFamily: 'monospace',
          fontWeight: '900',
          color: '#333',
          borderBottom: '2px solid #888',
          paddingBottom: '4px',
          marginBottom: '12px',
          textAlign: 'center',
          letterSpacing: '0.5px'
        }}
      >
        🎛️ {label.toUpperCase()}
      </Typography>

      {/* Main Bar Graphs Area */}
      <Box display="flex" justifyContent="space-between" height="150px" mb={2}>
        {/* PV Bar Graph (Measured) */}
        <Box display="flex" flexDirection="column" alignItems="center" width="60px">
          <Typography style={{ fontSize: '9px', fontWeight: 'bold', color: '#d32f2f' }}>PV</Typography>
          <Box
            style={{
              flex: 1,
              width: '18px',
              backgroundColor: '#111',
              border: '2px solid #555',
              borderRadius: '3px',
              position: 'relative',
              margin: '6px 0',
              overflow: 'hidden'
            }}
          >
            <Box
              style={{
                position: 'absolute',
                bottom: 0,
                width: '100%',
                height: `${pv}%`,
                backgroundColor: '#ff3131',
                transition: 'height 0.4s ease'
              }}
            />
          </Box>
          <Typography style={{ fontSize: '11px', fontWeight: 'bold', color: '#d32f2f' }}>
            {Math.round(pv)}%
          </Typography>
        </Box>

        {/* SP Slider/Bar (Target) */}
        <Box display="flex" flexDirection="column" alignItems="center" width="60px">
          <Typography style={{ fontSize: '9px', fontWeight: 'bold', color: '#2e7d32' }}>SP</Typography>
          <Box display="flex" style={{ flex: 1, margin: '6px 0' }} justifyContent="center">
            <Slider
              orientation="vertical"
              value={sp}
              onChange={(_, val) => onSpChange(val as number)}
              min={0}
              max={100}
              sx={{
                color: '#39ff14',
                '& .MuiSlider-track': { border: 'none' },
                '& .MuiSlider-thumb': {
                  width: 14,
                  height: 14,
                  backgroundColor: '#39ff14',
                  border: '2px solid #111',
                  '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
                    boxShadow: '0 0 5px rgba(57, 255, 20, 0.8)'
                  }
                },
                '& .MuiSlider-rail': { opacity: 1, backgroundColor: '#111', border: '1px solid #555', width: 6, borderRadius: 2 }
              }}
            />
          </Box>
          <Typography style={{ fontSize: '11px', fontWeight: 'bold', color: '#2e7d32' }}>
            {Math.round(sp)}%
          </Typography>
        </Box>

        {/* CV Output Bar Graph (Control Valve Output) */}
        <Box display="flex" flexDirection="column" alignItems="center" width="60px">
          <Typography style={{ fontSize: '9px', fontWeight: 'bold', color: '#0288d1' }}>OUT (CV)</Typography>
          <Box
            style={{
              flex: 1,
              width: '18px',
              backgroundColor: '#111',
              border: '2px solid #555',
              borderRadius: '3px',
              position: 'relative',
              margin: '6px 0',
              overflow: 'hidden'
            }}
          >
            <Box
              style={{
                position: 'absolute',
                bottom: 0,
                width: '100%',
                height: `${cv}%`,
                backgroundColor: '#0288d1',
                transition: 'height 0.4s ease'
              }}
            />
          </Box>
          <Typography style={{ fontSize: '11px', fontWeight: 'bold', color: '#0288d1' }}>
            {Math.round(cv)}%
          </Typography>
        </Box>
      </Box>

      {/* Control Variable Slider (Only enabled in Manual Mode) */}
      <Box mb={2} style={{ padding: '0 8px' }}>
        <Typography style={{ fontSize: '8px', color: '#666', fontWeight: 'bold', marginBottom: '2px' }}>
          SALIDA MANUAL (CV):
        </Typography>
        <Slider
          value={cv}
          disabled={mode === 'auto'}
          onChange={(_, val) => onCvChange(val as number)}
          min={0}
          max={100}
          size="small"
          sx={{
            color: mode === 'auto' ? '#888' : '#0288d1',
            '& .MuiSlider-thumb': { width: 12, height: 12 }
          }}
        />
      </Box>

      {/* Mode Switches */}
      <Box display="flex" justifyContent="space-between" alignItems="center" bgcolor="#1e1e1e" p="6px" borderRadius="4px" mb={2} border="1px solid #777">
        <Typography style={{ fontSize: '10px', color: '#aaa', fontWeight: 'bold' }}>
          MODO LOOP:
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography style={{ fontSize: '11px', color: mode === 'manual' ? '#ff3131' : '#888', fontWeight: 'bold' }}>MAN</Typography>
          <Switch
            checked={mode === 'auto'}
            onChange={(e) => onModeChange(e.target.checked ? 'auto' : 'manual')}
            size="small"
            color="success"
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': { color: '#39ff14' },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#39ff14' }
            }}
          />
          <Typography style={{ fontSize: '11px', color: mode === 'auto' ? '#39ff14' : '#888', fontWeight: 'bold' }}>AUTO</Typography>
        </Box>
      </Box>

      {/* Tuning Button */}
      <Button
        variant="outlined"
        size="small"
        fullWidth
        startIcon={<TuneIcon />}
        onClick={() => setShowTuning(!showTuning)}
        style={{
          fontFamily: 'monospace',
          fontSize: '9px',
          color: '#555',
          borderColor: '#888',
          textTransform: 'none'
        }}
      >
        {showTuning ? 'Ocultar Parámetros PID' : 'Sintonizar Parámetros PID'}
      </Button>

      {/* Expandable PID Tuning Parameters Panel */}
      <Collapse in={showTuning}>
        <Box mt={2} p="10px" bgcolor="#d5d5d5" borderRadius="4px" border="1px dashed #777">
          <Typography style={{ fontSize: '9px', fontWeight: 'bold', marginBottom: '8px', color: '#333', textAlign: 'center' }}>
            CONSTANTES PID (Tuning)
          </Typography>
          <Box display="flex" gap={1} mb={1.5} mt={1}>
            <TextField
              label="Kp"
              value={localKp}
              type="number"
              onChange={(e) => setLocalKp(parseFloat(e.target.value) || 0)}
              size="small"
              variant="outlined"
              inputProps={{ style: { fontFamily: 'monospace', fontSize: '10px', padding: '4px 6px' } }}
              InputLabelProps={{ style: { fontSize: '10px' } }}
            />
            <TextField
              label="Ki"
              value={localKi}
              type="number"
              onChange={(e) => setLocalKi(parseFloat(e.target.value) || 0)}
              size="small"
              variant="outlined"
              inputProps={{ style: { fontFamily: 'monospace', fontSize: '10px', padding: '4px 6px' } }}
              InputLabelProps={{ style: { fontSize: '10px' } }}
            />
            <TextField
              label="Kd"
              value={localKd}
              type="number"
              onChange={(e) => setLocalKd(parseFloat(e.target.value) || 0)}
              size="small"
              variant="outlined"
              inputProps={{ style: { fontFamily: 'monospace', fontSize: '10px', padding: '4px 6px' } }}
              InputLabelProps={{ style: { fontSize: '10px' } }}
            />
          </Box>
          <Button
            variant="contained"
            color="primary"
            size="small"
            fullWidth
            onClick={handleApplyTuning}
            style={{ fontFamily: 'monospace', fontSize: '9px', textTransform: 'none' }}
          >
            Aplicar Cambios
          </Button>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default PidControllerFaceplate;
