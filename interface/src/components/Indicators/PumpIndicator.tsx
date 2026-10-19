import React from 'react';
import { useThemeMode } from '../../CustomTheme';

interface PumpIndicatorProps {
  label: string;
  state: 'running' | 'stopped' | 'fault';
  onClick?: () => void;
  rotation?: number;
}

export const PumpIndicator: React.FC<PumpIndicatorProps> = ({
  label,
  state,
  onClick,
  rotation = 0
}) => {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

  let mainColor = '#777';
  let glowColor = 'transparent';
  let isRunning = false;
  let isFlashing = false;

  if (state === 'running') {
    mainColor = '#39ff14';
    glowColor = 'rgba(57, 255, 20, 0.5)';
    isRunning = true;
  } else if (state === 'stopped') {
    mainColor = '#ff3131';
    glowColor = 'rgba(255, 49, 49, 0.2)';
  } else if (state === 'fault') {
    mainColor = '#ffea00';
    glowColor = 'rgba(255, 234, 0, 0.4)';
    isFlashing = true;
  }

  return (
    <div
      onClick={onClick}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '10px',
        background: isDark
          ? 'linear-gradient(145deg, #182234 0%, #0f172a 100%)'
          : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '8px',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #cbd5e1',
        boxShadow: isDark
          ? 'inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 4px 12px rgba(0, 0, 0, 0.4)'
          : '0 2px 8px rgba(0, 0, 0, 0.06)',
        width: '92px',
        userSelect: 'none',
        boxSizing: 'border-box',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease'
      }}
    >
      <style>
        {`
          @keyframes pump-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes pump-alarm {
            0% { opacity: 1; filter: drop-shadow(0 0 2px ${glowColor}); }
            50% { opacity: 0.4; filter: drop-shadow(0 0 10px ${glowColor}); }
            100% { opacity: 1; filter: drop-shadow(0 0 2px ${glowColor}); }
          }
        `}
      </style>
      <div
        style={{
          width: '56px',
          height: '56px',
          backgroundColor: '#090e17',
          borderRadius: '50%',
          border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6)'
        }}
      >
        <svg
          width="46"
          height="46"
          viewBox="0 0 100 100"
          style={{
            transform: `rotate(${rotation}deg)`,
            filter: `drop-shadow(0 0 6px ${glowColor})`,
            animation: isFlashing ? 'pump-alarm 1s infinite ease-in-out' : 'none'
          }}
        >
          <circle cx="50" cy="50" r="42" fill="#1e293b" stroke={mainColor} strokeWidth="4" />
          <g
            style={{
              transformOrigin: '50px 50px',
              animation: isRunning ? 'pump-spin 1.2s infinite linear' : 'none'
            }}
          >
            <circle cx="50" cy="50" r="12" fill={mainColor} />
            <path d="M 50,50 Q 50,25 35,16" stroke={mainColor} strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M 50,50 Q 75,50 84,35" stroke={mainColor} strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M 50,50 Q 50,75 65,84" stroke={mainColor} strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M 50,50 Q 25,50 16,65" stroke={mainColor} strokeWidth="4" fill="none" strokeLinecap="round" />
          </g>
          <polygon points="50,8 90,8 80,24 50,24" fill="#334155" stroke={mainColor} strokeWidth="2" />
        </svg>
      </div>
      <span
        style={{
          fontSize: '9.5px',
          fontWeight: '900',
          color: isDark ? '#cbd5e1' : '#334155',
          marginTop: '6px',
          fontFamily: 'monospace',
          letterSpacing: '0.5px',
          textAlign: 'center'
        }}
      >
        {label.toUpperCase()}
      </span>
      <span
        style={{
          fontSize: '8px',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          color: mainColor,
          marginTop: '2px',
          letterSpacing: '0.5px'
        }}
      >
        {state === 'running' ? 'RUNNING' : state === 'stopped' ? 'STOPPED' : 'FAULT'}
      </span>
    </div>
  );
};

export default PumpIndicator;
