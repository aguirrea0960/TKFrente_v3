import React from 'react';

interface ValveIndicatorProps {
  label: string;
  state: 'open' | 'closed' | 'transit';
  orientation?: 'horizontal' | 'vertical';
  onClick?: () => void;
}

export const ValveIndicator: React.FC<ValveIndicatorProps> = ({
  label,
  state,
  orientation = 'horizontal',
  onClick
}) => {
  // Configuración de colores
  let mainColor = '#777'; // closed (Gris/Rojo)
  let glowColor = 'transparent';
  let isFlashing = false;

  if (state === 'open') {
    mainColor = '#39ff14'; // open (Verde brillante)
    glowColor = 'rgba(57, 255, 20, 0.5)';
  } else if (state === 'closed') {
    mainColor = '#ff3131'; // closed (Rojo brillante)
    glowColor = 'rgba(255, 49, 49, 0.2)';
  } else if (state === 'transit') {
    mainColor = '#ffea00'; // transit (Amarillo)
    glowColor = 'rgba(255, 234, 0, 0.4)';
    isFlashing = true;
  }

  // Rotar el SVG según la orientación
  const svgRotation = orientation === 'vertical' ? 'rotate(90)' : 'rotate(0)';

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
          @keyframes valve-flash {
            0% { opacity: 1; filter: drop-shadow(0 0 2px ${glowColor}); }
            50% { opacity: 0.4; filter: drop-shadow(0 0 10px ${glowColor}); }
            100% { opacity: 1; filter: drop-shadow(0 0 2px ${glowColor}); }
          }
        `}
      </style>

      {/* Etiqueta de la válvula */}
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

      {/* Cuerpo de la Válvula */}
      <div
        onClick={onClick}
        style={{
          width: '60px',
          height: '45px',
          backgroundColor: '#2b2b2b',
          border: '1px solid #777',
          borderRadius: '3px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: onClick ? 'pointer' : 'default',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.6)',
          position: 'relative'
        }}
      >
        <svg
          width="50"
          height="35"
          viewBox="0 0 50 35"
          style={{
            animation: isFlashing ? 'valve-flash 1s infinite ease-in-out' : 'none',
            filter: `drop-shadow(0 0 4px ${glowColor})`,
            transition: 'filter 0.3s ease',
            transform: svgRotation,
            transformOrigin: 'center'
          }}
        >
          {/* Triángulos ISA de la válvula */}
          <polygon
            points="5,5 25,17.5 5,30"
            fill={mainColor}
            stroke="#111"
            strokeWidth="1.5"
            style={{ transition: 'fill 0.3s ease' }}
          />
          <polygon
            points="45,5 25,17.5 45,30"
            fill={mainColor}
            stroke="#111"
            strokeWidth="1.5"
            style={{ transition: 'fill 0.3s ease' }}
          />
          
          {/* Círculo central (Solenoide / Actuador) */}
          <circle
            cx="25"
            cy="17.5"
            r="4.5"
            fill="#111"
            stroke="#555"
            strokeWidth="1"
          />

          {/* Caja del actuador en la parte superior (línea de pilotaje) */}
          <line x1="25" y1="13" x2="25" y2="4" stroke="#fff" strokeWidth="1.5" />
          <rect x="18" y="1" width="14" height="4" fill="#666" stroke="#111" strokeWidth="1" />
        </svg>
      </div>

      {/* Estado en Texto */}
      <span
        style={{
          fontSize: '8.5px',
          marginTop: '6px',
          fontWeight: 'bold',
          fontFamily: 'monospace',
          color: state === 'open' ? '#008000' : state === 'closed' ? '#c62828' : '#e65100'
        }}
      >
        {state.toUpperCase()}
      </span>
    </div>
  );
};

export default ValveIndicator;
