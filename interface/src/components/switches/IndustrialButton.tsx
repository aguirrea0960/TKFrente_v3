import React from 'react';

interface IndustrialButtonProps {
  label: string;
  color?: 'red' | 'green' | 'blue';
  onClick: () => void;
  disabled?: boolean; 
}

export const IndustrialButton: React.FC<IndustrialButtonProps> = ({
  label,
  color = 'green',
  onClick,
  disabled = false // Recibimos la prop
}) => {
  // Colores base
  const bgColor = color === 'red' ? '#d32f2f' : color === 'green' ? '#388e3c' : '#1976d2';
  const activeColor = color === 'red' ? '#b71c1c' : color === 'green' ? '#2e7d32' : '#1565c0';
  
  // Color gris si está deshabilitado
  const finalBgColor = disabled ? '#9e9e9e' : bgColor;

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '12px',
        backgroundColor: '#e0e0e0',
        borderRadius: '4px',
        border: '1px solid #bcbcbc',
        boxShadow: '1px 1px 2px rgba(0,0,0,0.1)',
        width: '100px',
        opacity: disabled ? 0.7 : 1 // Opacidad general si está desactivado
      }}
    >
      <button
        onClick={!disabled ? onClick : undefined} // Bloqueamos el click si está disabled
        disabled={disabled}
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: finalBgColor,
          backgroundImage: disabled 
            ? 'none' 
            : `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2), transparent)`,
          boxShadow: disabled 
            ? '0 2px 0 #777' // Sombra plana si está deshabilitado
            : '0 4px 0 #222, 0 6px 10px rgba(0,0,0,0.3)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.1s',
          pointerEvents: disabled ? 'none' : 'auto' // Evita eventos de mouse
        }}
        onMouseDown={(e) => {
          if (disabled) return;
          e.currentTarget.style.transform = 'translateY(3px)';
          e.currentTarget.style.boxShadow = '0 1px 0 #222, 0 2px 5px rgba(0,0,0,0.3)';
          e.currentTarget.style.backgroundColor = activeColor;
        }}
        onMouseUp={(e) => {
          if (disabled) return;
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 0 #222, 0 6px 10px rgba(0,0,0,0.3)';
          e.currentTarget.style.backgroundColor = bgColor;
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: disabled 
                ? '2px solid rgba(0,0,0,0.1)' 
                : '2px solid rgba(255,255,255,0.1)'
          }}
        />
      </button>
      <span
        style={{
          fontSize: '10px',
          fontWeight: '900',
          color: disabled ? '#888' : '#444',
          marginTop: '10px',
          fontFamily: 'monospace',
          textAlign: 'center'
        }}
      >
        {label.toUpperCase()}
      </span>
    </div>
  );
};

export default IndustrialButton;