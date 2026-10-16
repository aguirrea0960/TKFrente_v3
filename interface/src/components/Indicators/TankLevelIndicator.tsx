import React from 'react';

interface TankLevelIndicatorProps {
  level: number; // Nivel del 0 al 100%
  label: string; // Nombre identificador
  fluidColor?: string; // Color del líquido
  showLabels?: boolean;
}

export const TankLevelIndicator: React.FC<TankLevelIndicatorProps> = ({
  level,
  label,
  fluidColor = '#3a95d2',
  showLabels = true
}) => {
  const normalizedLevel = Math.min(Math.max(level, 0), 100);

  // Criterios de alarmas industriales
  const isHighHigh = normalizedLevel >= 90;
  const isLowLow = normalizedLevel <= 10;

  // Colores del borde en caso de alarma
  let borderGlow = 'none';
  let tankBorderColor = '#555';
  if (isHighHigh) {
    borderGlow = '0 0 15px #ff1744';
    tankBorderColor = '#ff1744';
  } else if (isLowLow) {
    borderGlow = '0 0 15px #ffea00';
    tankBorderColor = '#ffea00';
  }

  // Altura del líquido en px: la escala útil de la regla va desde y=180 (0%) hasta y=20 (100%), total 160px
  const fluidHeight = (normalizedLevel / 100) * 160;

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '14px',
        backgroundColor: '#e0e0e0',
        borderRadius: '8px',
        border: '1px solid #bcbcbc',
        boxShadow: '2px 2px 6px rgba(0,0,0,0.2)',
        width: '190px',
        userSelect: 'none',
        boxSizing: 'border-box'
      }}
    >
      {/* Animación opcional para alarma visual del tanque */}
      {isHighHigh && (
        <style>
          {`
            @keyframes tank-alarm-flash {
              0% { box-shadow: 0 0 5px #ff1744, inset 0 0 5px #ff1744; }
              50% { box-shadow: 0 0 18px #ff1744, inset 0 0 10px #ff1744; }
              100% { box-shadow: 0 0 5px #ff1744, inset 0 0 5px #ff1744; }
            }
          `}
        </style>
      )}

      {/* Título en tipografía monoespaciada HMI */}
      <span
        style={{
          fontSize: '11px',
          fontWeight: '900',
          color: '#222',
          marginBottom: '10px',
          fontFamily: 'monospace',
          letterSpacing: '1px',
          textAlign: 'center'
        }}
      >
        {label.toUpperCase()}
      </span>

      {/* Cuerpo del Tanque/Silo en SVG */}
      <div
        style={{
          position: 'relative',
          width: '140px',
          height: '180px',
          backgroundColor: '#111',
          borderRadius: '12px/16px',
          border: `2px solid ${tankBorderColor}`,
          boxShadow: isHighHigh ? 'tank-alarm-flash 1.2s infinite ease-in-out' : borderGlow,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          transition: 'all 0.3s ease'
        }}
      >
        {/* SVG de fluidos, rejilla de nivel y efectos 3D de cristal/acero */}
        <svg
          width="140"
          height="180"
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          {/* Fondo del tanque */}
          <rect width="140" height="180" fill="url(#tank-metal-grad)" />

          {/* Líquido (Fluido dinámico) */}
          <rect
            x="0"
            y={180 - fluidHeight}
            width="140"
            height={fluidHeight}
            fill={fluidColor}
            style={{
              transition: 'y 0.5s ease-out, height 0.5s ease-out, fill 0.5s ease',
            }}
          />

          {/* Sombra de relieve e iluminación cilíndrica (Cilindro 3D effect) */}
          <rect width="140" height="180" fill="url(#tank-cylinder-shade)" style={{ mixBlendMode: 'multiply' }} />
          <rect width="140" height="180" fill="url(#tank-cylinder-reflection)" style={{ mixBlendMode: 'screen', opacity: 0.45 }} />

          {/* Escala lateral de medición milimétrica */}
          <g stroke="#ffffff" strokeWidth="0.8" opacity="0.45">
            {/* Ticks cada 10% */}
            <line x1="4" y1="20" x2="16" y2="20" strokeWidth="1.2" /> {/* 100% */}
            <line x1="4" y1="36" x2="10" y2="36" />
            <line x1="4" y1="52" x2="10" y2="52" />
            <line x1="4" y1="68" x2="10" y2="68" />
            <line x1="4" y1="84" x2="10" y2="84" />
            <line x1="4" y1="100" x2="16" y2="100" strokeWidth="1.2" /> {/* 50% */}
            <line x1="4" y1="116" x2="10" y2="116" />
            <line x1="4" y1="132" x2="10" y2="132" />
            <line x1="4" y1="148" x2="10" y2="148" />
            <line x1="4" y1="164" x2="10" y2="164" />
            <line x1="4" y1="178" x2="16" y2="178" strokeWidth="1.2" /> {/* 0% */}
          </g>
          {/* Indicaciones numéricas de escala */}
          <g fill="#ffffff" fontSize="7" fontFamily="monospace" opacity="0.65">
            <text x="18" y="23">100</text>
            <text x="18" y="103">50</text>
            <text x="18" y="179">0</text>
          </g>

          {/* Gradientes definiciones */}
          <defs>
            <linearGradient id="tank-metal-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1a1a1a" />
              <stop offset="50%" stopColor="#2c2c2c" />
              <stop offset="100%" stopColor="#111111" />
            </linearGradient>
            <linearGradient id="tank-cylinder-shade" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#000000" stopOpacity="0.8" />
              <stop offset="30%" stopColor="#000000" stopOpacity="0" />
              <stop offset="70%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="tank-cylinder-reflection" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="20%" stopColor="#ffffff" stopOpacity="0.6" />
              <stop offset="25%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Overlay digital del nivel % en pantalla flotante */}
        <div
          style={{
            position: 'absolute',
            bottom: '15px',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            border: '1px solid #444',
            borderRadius: '3px',
            padding: '2px 6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10
          }}
        >
          <span
            style={{
              color: isHighHigh ? '#ff1744' : isLowLow ? '#ffea00' : '#39ff14',
              fontFamily: 'monospace',
              fontSize: '11px',
              fontWeight: 'bold',
              transition: 'color 0.5s ease'
            }}
          >
            {Math.round(normalizedLevel)}%
          </span>
        </div>
      </div>

      {/* Detalle en porcentaje en la base (Visualizador LED HMI) */}
      {showLabels && (
        <div
          style={{
            marginTop: '8px',
            backgroundColor: '#1e1e1e',
            border: '2px solid #555',
            borderRadius: '3px',
            width: '100%',
            padding: '4px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8)'
          }}
        >
          <span
            style={{
              fontFamily: 'monospace',
              color: isHighHigh ? '#ff3131' : isLowLow ? '#ffea00' : '#39ff14',
              fontSize: '13px',
              fontWeight: 'bold',
              letterSpacing: '0.5px'
            }}
          >
            {normalizedLevel.toFixed(1)}%
          </span>
          <span
            style={{
              fontSize: '7.5px',
              color: '#888',
              fontWeight: 'bold',
              marginTop: '1px',
              fontFamily: 'monospace'
            }}
          >
            NIVEL
          </span>
        </div>
      )}
    </div>
  );
};

export default TankLevelIndicator;
