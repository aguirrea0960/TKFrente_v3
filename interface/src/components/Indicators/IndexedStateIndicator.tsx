import React from 'react';

interface IndexedStateIndicatorProps {
  label: string;
  value: number;
  states: string[];
  colors?: string[];
}

// Calcula luminancia relativa de un color hex para elegir texto blanco o negro
function getContrastText(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.35 ? '#111111' : '#ffffff';
}

export const IndexedStateIndicator: React.FC<IndexedStateIndicatorProps> = ({
  label,
  value,
  states,
  colors = []
}) => {
  const currentStateText = states[value] || "UNKNOWN";
  const displayColor = colors[value] || "#1a1a1a";
  const textColor = getContrastText(displayColor);

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
        minWidth: '160px'
      }}
    >
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
          width: '100%',
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
            backgroundColor: displayColor,
            backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)`,
            borderRadius: '1px',
            color: textColor,
            fontSize: '12px',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            textAlign: 'center',
            padding: '0 5px',
            transition: 'background-color 0.3s ease, color 0.3s ease',
            textShadow: textColor === '#ffffff' ? '0 1px 2px rgba(0,0,0,0.6)' : 'none'
          }}
        >
          {currentStateText.toUpperCase()}
        </div>
      </div>
    </div>
  );
};

export default IndexedStateIndicator;