import React from 'react';
import { useThemeMode } from '../../CustomTheme';

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
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

  let mainColor = '#777';
  let glowColor = 'transparent';
  let isFlashing = false;

  if (state === 'open') {
    mainColor = '#39ff14';
    glowColor = 'rgba(57, 255, 20, 0.5)';
  } else if (state === 'closed') {
    mainColor = '#ff3131';
    glowColor = 'rgba(255, 49, 49, 0.2)';
  } else if (state === 'transit') {
    mainColor = '#ffea00';
    glowColor = 'rgba(255, 234, 0, 0.4)';
    isFlashing = true;
  }

  const svgRotation = orientation === 'vertical' ? 'rotate(90)' : 'rotate(0)';

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
          @keyframes valve-flash {
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
          borderRadius: '6px',
          border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6)'
        }}
      >
        <svg
          width="44"
          height="44"
          viewBox="0 0 100 100"
          style={{
            transform: svgRotation,
            filter: `drop-shadow(0 0 6px ${glowColor})`,
            animation: isFlashing ? 'valve-flash 1s infinite ease-in-out' : 'none'
          }}
        >
          <polygon points="15,20 15,80 50,50" fill={mainColor} stroke="#111" strokeWidth="3" />
          <polygon points="85,20 85,80 50,50" fill={mainColor} stroke="#111" strokeWidth="3" />
          <circle cx="50" cy="50" r="10" fill="#222" stroke={mainColor} strokeWidth="3" />
          <line x1="50" y1="40" x2="50" y2="15" stroke="#888" strokeWidth="4" />
          <rect x="35" y="8" width="30" height="7" rx="2" fill="#555" stroke="#888" strokeWidth="1.5" />
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
        {state === 'open' ? 'OPEN' : state === 'closed' ? 'CLOSED' : 'TRANSIT'}
      </span>
    </div>
  );
};

export default ValveIndicator;
