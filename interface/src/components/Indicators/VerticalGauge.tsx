import React from 'react';

interface VerticalGaugeProps {
  label: string;
  value: number; // 0 a 100
  unit?: string;
  color?: string;
  useDynamicColor?: boolean; // Nueva propiedad
}

export const VerticalGauge: React.FC<VerticalGaugeProps> = ({
  label,
  value,
  unit = "L",
  color = "#39ff14",
  useDynamicColor = false
}) => {
  // Aseguramos que el valor esté entre 0 y 100
  const normalizedValue = Math.min(Math.max(value, 0), 100);

  // Lógica de colores por rangos
  const getDynamicColor = (val: number) => {
    if (val < 20) return "#ff1744"; // Rojo Crítico
    if (val < 60) return "#ffea00"; // Amarillo Advertencia
    return "#39ff14";                // Verde OK (el original que tenías)
  };

  const finalColor = useDynamicColor ? getDynamicColor(normalizedValue) : color;

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
        width: '80px'
      }}
    >
      <span
        style={{
          fontSize: '10px',
          fontWeight: '900',
          color: '#444',
          marginBottom: '8px',
          fontFamily: 'monospace',
          letterSpacing: '1px',
          textAlign: 'center'
        }}
      >
        {label.toUpperCase()}
      </span>
      <div
        style={{
          width: '30px',
          height: '120px',
          backgroundColor: '#1a1a1a',
          padding: '4px',
          borderRadius: '2px',
          display: 'flex',
          flexDirection: 'column-reverse',
          boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.7)',
          border: '1px solid #333'
        }}
      >
        <div
          style={{
            width: '100%',
            height: `${normalizedValue}%`,
            backgroundColor: finalColor,
            backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0.3) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)`,
            borderRadius: '1px',
            transition: 'height 0.5s ease-out, background-color 0.5s ease', // Transición suave de color
            boxShadow: `0 0 10px ${finalColor}`
          }}
        />
      </div>
      <div
        style={{
          marginTop: '8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <span
          style={{
            color: '#222',
            fontSize: '14px',
            fontWeight: 'bold',
            fontFamily: 'monospace'
          }}
        >
          {Math.round(value)}
        </span>
        <span
          style={{
            color: '#666',
            fontSize: '9px',
            fontWeight: 'bold'
          }}
        >
          {unit}
        </span>
      </div>
    </div>
  );
};

export default VerticalGauge;