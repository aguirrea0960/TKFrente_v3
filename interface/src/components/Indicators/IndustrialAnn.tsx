import React from 'react';
import { useThemeMode } from '../../CustomTheme';

interface IndustrialAnnunciatorProps {
  label: string;
  state: boolean;
  trueText?: string;
  falseText?: string;
  shouldPulse?: boolean;
}

export const IndustrialAnnunciator: React.FC<IndustrialAnnunciatorProps> = ({
  label,
  state,
  trueText = "ACTIVO",
  falseText = "INACTIVO",
  shouldPulse = false
}) => {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

  const colors = state
    ? { light: '#39ff14', dark: '#008000', glow: 'rgba(57, 255, 20, 0.6)' }
    : { light: '#ff3131', dark: '#8b0000', glow: 'rgba(255, 49, 49, 0.4)' };

  const isAnimating = state && shouldPulse;

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '10px 14px',
        background: isDark
          ? 'linear-gradient(145deg, #182234 0%, #0f172a 100%)'
          : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '8px',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #cbd5e1',
        boxShadow: isDark
          ? 'inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 4px 12px rgba(0, 0, 0, 0.4)'
          : '0 2px 8px rgba(0, 0, 0, 0.06)',
        userSelect: 'none',
        transition: 'all 0.3s ease'
      }}
    >
      <style>
        {`
          @keyframes annunciator-pulse {
            0% { opacity: 1; box-shadow: inset 0px 0px 8px rgba(0,0,0,0.6), 0px 0px 12px ${colors.glow}; }
            50% { opacity: 0.7; box-shadow: inset 0px 0px 8px rgba(0,0,0,0.6), 0px 0px 20px ${colors.glow}; }
            100% { opacity: 1; box-shadow: inset 0px 0px 8px rgba(0,0,0,0.6), 0px 0px 12px ${colors.glow}; }
          }
        `}
      </style>

      <span
        style={{
          fontSize: '10px',
          fontWeight: '900',
          color: isDark ? '#cbd5e1' : '#334155',
          marginBottom: '6px',
          fontFamily: 'monospace',
          letterSpacing: '1px'
        }}
      >
        {label.toUpperCase()}
      </span>

      <div
        style={{
          width: '78px',
          height: '28px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: '4px',
          backgroundColor: colors.dark,
          backgroundImage: `linear-gradient(180deg, ${colors.light} 0%, ${colors.dark} 100%)`,
          boxShadow: isAnimating
            ? `inset 0px 0px 8px rgba(0,0,0,0.6), 0px 0px 14px ${colors.glow}`
            : 'inset 0px 0px 5px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.3)',
          border: '1px solid #111',
          animation: isAnimating ? 'annunciator-pulse 1s infinite' : 'none'
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: '900',
            fontFamily: 'monospace',
            color: '#fff',
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
            letterSpacing: '1px'
          }}
        >
          {state ? trueText : falseText}
        </span>
      </div>
    </div>
  );
};

export default IndustrialAnnunciator;
