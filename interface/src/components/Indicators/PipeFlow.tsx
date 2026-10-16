import React from 'react';

interface PipeFlowProps {
  flowActive: boolean;
  fluidColor: string;
  direction?: 'right' | 'left' | 'up' | 'down';
  length?: number | string;
  thickness?: number;
}

export const PipeFlow: React.FC<PipeFlowProps> = ({
  flowActive,
  fluidColor,
  direction = 'right',
  length = 150,
  thickness = 14
}) => {
  const isVertical = direction === 'up' || direction === 'down';
  const width = isVertical ? thickness : length;
  const height = isVertical ? length : thickness;

  // Parámetros de la animación según sentido
  // Si flowActive es falso, el offset queda estático
  let animationName = 'none';
  if (flowActive) {
    if (direction === 'right' || direction === 'down') {
      animationName = 'flow-forward 1.5s infinite linear';
    } else {
      animationName = 'flow-reverse 1.5s infinite linear';
    }
  }

  // Coordenadas de la línea de flujo interior
  const x1 = isVertical ? thickness / 2 : 0;
  const y1 = isVertical ? 0 : thickness / 2;
  const x2 = isVertical ? thickness / 2 : length;
  const y2 = isVertical ? length : thickness / 2;

  return (
    <div
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        display: 'inline-block',
        position: 'relative',
        verticalAlign: 'middle',
        overflow: 'hidden',
        borderRadius: '3px'
      }}
    >
      {/* Definición de la animación de flujo CSS */}
      <style>
        {`
          @keyframes flow-forward {
            from { stroke-dashoffset: 20; }
            to { stroke-dashoffset: 0; }
          }
          @keyframes flow-reverse {
            from { stroke-dashoffset: 0; }
            to { stroke-dashoffset: 20; }
          }
        `}
      </style>

      <svg
        width="100%"
        height="100%"
        style={{ display: 'block' }}
      >
        {/* Cuerpo exterior de la tubería metálica (Efecto 3D / Bisel) */}
        <rect
          width="100%"
          height="100%"
          fill="url(#pipe-metallic-grad)"
          stroke="#444"
          strokeWidth="1"
        />

        {/* Brillo central en la tubería para volumen */}
        <rect
          width="100%"
          height="100%"
          fill="url(#pipe-center-shine)"
          opacity="0.4"
        />

        {/* Línea de fluido animada interior */}
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={flowActive ? fluidColor : 'transparent'}
          strokeWidth={thickness - 6}
          strokeDasharray="8, 8"
          strokeLinecap="round"
          style={{
            animation: animationName,
            transition: 'stroke 0.4s ease, stroke-width 0.4s ease',
            opacity: flowActive ? 0.95 : 0
          }}
        />

        {/* Definición de gradientes metálicos */}
        <defs>
          <linearGradient
            id="pipe-metallic-grad"
            x1={isVertical ? '0%' : '0%'}
            y1={isVertical ? '0%' : '0%'}
            x2={isVertical ? '100%' : '0%'}
            y2={isVertical ? '0%' : '100%'}
          >
            <stop offset="0%" stopColor="#555555" />
            <stop offset="30%" stopColor="#aaaaaa" />
            <stop offset="50%" stopColor="#dddddd" />
            <stop offset="70%" stopColor="#888888" />
            <stop offset="100%" stopColor="#333333" />
          </linearGradient>
          <linearGradient
            id="pipe-center-shine"
            x1={isVertical ? '0%' : '0%'}
            y1={isVertical ? '0%' : '0%'}
            x2={isVertical ? '100%' : '0%'}
            y2={isVertical ? '0%' : '100%'}
          >
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default PipeFlow;
