import React from 'react';

interface CircularGaugeProps {
  label: string;
  value: number; // 0 a 100
  unit?: string;
  color?: string;
  useDynamicColor?: boolean; // Nueva propiedad
}

export const CircularGauge: React.FC<CircularGaugeProps> = ({
  label,
  value,
  unit = "%",
  color = "#39ff14",
  useDynamicColor = false
}) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  // Aseguramos que el valor esté entre 0 y 100 para el cálculo
  const normalizedValue = Math.min(Math.max(value, 0), 100);
  const offset = circumference - (normalizedValue / 100) * circumference;

  // Lógica de colores dinámica
  const getDynamicColor = (val: number) => {
    if (val < 15) return "#ff1744"; // Rojo (Crítico / Reserva)
    if (val < 40) return "#ffea00"; // Amarillo (Nivel Bajo)
    return "#39ff14";                // Verde (Normal)
  };

  const finalColor = useDynamicColor ? getDynamicColor(normalizedValue) : color;

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
        width: '120px'
      }}
    >
      <span
        style={{
          fontSize: '11px',
          fontWeight: '900',
          color: '#444',
          marginBottom: '8px',
          fontFamily: 'monospace',
          letterSpacing: '1px'
        }}
      >
        {label.toUpperCase()}
      </span>
      <div
        style={{
          position: 'relative',
          width: '80px',
          height: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1a1a',
          borderRadius: '50%',
          border: '3px solid #333',
          boxShadow: 'inset 0px 0px 10px rgba(0,0,0,0.8)'
        }}
      >
        <svg
          width="80"
          height="80"
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Círculo de fondo (riel) */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="#333"
            strokeWidth="6"
            fill="transparent"
          />
          {/* Círculo de progreso (dinámico) */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke={finalColor}
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={circumference}
            style={{
              strokeDashoffset: offset,
              transition: 'stroke-dashoffset 0.5s ease-in-out, stroke 0.5s ease',
              filter: `drop-shadow(0 0 3px ${finalColor})`
            }}
            strokeLinecap="round"
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <span
            style={{
              color: '#fff',
              fontSize: '16px',
              fontWeight: 'bold',
              fontFamily: 'monospace'
            }}
          >
            {Math.round(value)}
          </span>
          <span
            style={{
              color: finalColor,
              fontSize: '9px',
              fontWeight: 'bold',
              transition: 'color 0.5s ease'
            }}
          >
            {unit}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CircularGauge;