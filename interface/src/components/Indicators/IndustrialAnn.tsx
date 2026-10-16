import React from 'react';

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
  shouldPulse = false // Por defecto no parpadea
}) => {
  const colors = state
    ? { light: '#39ff14', dark: '#008000', glow: 'rgba(57, 255, 20, 0.6)' }
    : { light: '#ff3131', dark: '#8b0000', glow: 'rgba(255, 49, 49, 0.4)' };

  // Solo parpadea si el estado es TRUE Y la prop shouldPulse es TRUE
  const isAnimating = state && shouldPulse;

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
        boxShadow: '1px 1px 2px rgba(0,0,0,0.1)'
      }}
    >
      {/* Definición de la animación de parpadeo */}
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
          fontSize: '11px',
          fontWeight: '900',
          color: '#444',
          marginBottom: '6px',
          fontFamily: 'monospace',
          letterSpacing: '1px'
        }}
      >
        {label.toUpperCase()}
      </span>
      <div
        style={{
          width: '120px',
          height: '40px',
          backgroundColor: '#1a1a1a',
          padding: '3px',
          borderRadius: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.5)'
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.dark,
            backgroundImage: `linear-gradient(180deg, ${colors.light} 0%, ${colors.dark} 100%)`,
            borderRadius: '1px',
            color: state ? '#000' : '#fff',
            fontSize: '12px',
            fontWeight: 'bold',
            transition: 'all 0.2s ease-in-out',
            // Control dinámico de la animación
            animation: isAnimating ? 'annunciator-pulse 1.5s infinite ease-in-out' : 'none',
            textShadow: state ? '0px 0px 2px rgba(255,255,255,0.5)' : 'none'
          }}
        >
          {state ? trueText : falseText}
        </div>
      </div>
    </div>
  );
};

export default IndustrialAnnunciator;