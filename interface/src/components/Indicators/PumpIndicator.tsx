import React from 'react';

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
  let mainColor = '#777'; // stopped
  let glowColor = 'transparent';
  let isRunning = false;
  let isFlashing = false;

  if (state === 'running') {
    mainColor = '#39ff14'; // green
    glowColor = 'rgba(57, 255, 20, 0.5)';
    isRunning = true;
  } else if (state === 'stopped') {
    mainColor = '#ff3131'; // red/stopped
    glowColor = 'rgba(255, 49, 49, 0.2)';
  } else if (state === 'fault') {
    mainColor = '#ffea00'; // yellow/fault
    glowColor = 'rgba(255, 234, 0, 0.4)';
    isFlashing = true;
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '10px',
        backgroundColor: '#e0e0e0',
        borderRadius: '4px',
        border: '1px solid #bcbcbc',
        boxShadow: '1px 1px 2px rgba(0,0,0,0.1)',
        width: '90px',
        userSelect: 'none',
        boxSizing: 'border-box'
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

      {/* Etiqueta del motor/bomba */}
      <span
        style={{
          fontSize: '9px',
          fontWeight: '900',
          color: '#444',
          marginBottom: '6px',
          fontFamily: 'monospace',
          letterSpacing: '0.5px',
          textAlign: 'center'
        }}
      >
        {label.toUpperCase()}
      </span>

      {/* Caja de contención de la bomba */}
      <div
        onClick={onClick}
        style={{
          width: '60px',
          height: '60px',
          backgroundColor: '#2b2b2b',
          border: '1px solid #777',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: onClick ? 'pointer' : 'default',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.7)',
          position: 'relative',
          animation: isFlashing ? 'pump-alarm 1s infinite ease-in-out' : 'none',
          filter: `drop-shadow(0 0 4px ${glowColor})`,
          transition: 'all 0.3s ease'
        }}
      >
        {/* SVG de la bomba centrífuga */}
        <svg
          width="50"
          height="50"
          viewBox="0 0 50 50"
          style={{ 
            position: 'absolute',
            transform: `rotate(${rotation}deg)`,
            transformOrigin: '25px 25px'
          }}
        >
          {/* Voluta/Carcasa externa de la bomba (No gira) */}
          <path
            d="M 25,5 A 20,20 0 1,1 15,42 L 5,42 L 5,34 L 10,34 A 20,20 0 0,1 25,5 Z"
            fill="none"
            stroke="#555"
            strokeWidth="1.5"
          />
          {/* Flecha indicadora de descarga centrífuga */}
          <polygon
            points="5,38 0,38 5,34 5,42"
            fill="#555"
          />

          {/* Eje y Aspas del Impulsor (Gira cuando isRunning = true) */}
          <g
            style={{
              transformOrigin: '25px 25px',
              animation: isRunning ? 'pump-spin 1s infinite linear' : 'none',
              transition: 'transform 0.5s ease-out'
            }}
          >
            {/* Círculo del rotor central */}
            <circle cx="25" cy="25" r="16" fill={mainColor} stroke="#111" strokeWidth="1" />
            <circle cx="25" cy="25" r="4" fill="#111" />
            
            {/* Álabes / Aspas de la bomba */}
            <line x1="25" y1="9" x2="25" y2="41" stroke="#111" strokeWidth="2.5" />
            <line x1="9" y1="25" x2="41" y2="25" stroke="#111" strokeWidth="2.5" />
            <line x1="13.7" y1="13.7" x2="36.3" y2="36.3" stroke="#111" strokeWidth="2.5" />
            <line x1="13.7" y1="36.3" x2="36.3" y2="13.7" stroke="#111" strokeWidth="2.5" />
          </g>
        </svg>
      </div>

      {/* Estado */}
      <span
        style={{
          fontSize: '8.5px',
          marginTop: '6px',
          fontWeight: 'bold',
          fontFamily: 'monospace',
          color: state === 'running' ? '#008000' : state === 'stopped' ? '#c62828' : '#e65100'
        }}
      >
        {state === 'running' ? 'RUN' : state.toUpperCase()}
      </span>
    </div>
  );
};

export default PumpIndicator;
