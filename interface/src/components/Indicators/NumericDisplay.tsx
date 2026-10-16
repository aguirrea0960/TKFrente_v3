import React from 'react';

interface NumericDisplayProps {
  label: string;
  value: number | string;
  unit?: string;
}

export const NumericDisplay: React.FC<NumericDisplayProps> = ({
  label,
  value,
  unit = ""
}) => {
  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: '12px 16px',
        backgroundColor: '#cccccc',
        borderRadius: '8px',
        border: '1px solid #b0b0b0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        minWidth: '140px'
      }}
    >
      <span
        style={{
          fontSize: '13px',
          fontWeight: '600',
          color: '#555555',
          marginBottom: '8px',
          fontFamily: 'sans-serif'
        }}
      >
        {label}
      </span>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '4px'
        }}
      >
        <span
          style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#1a1a1a',
            fontFamily: 'monospace'
          }}
        >
          {typeof value === 'number' ? value.toFixed(2) : value}
        </span>
        {unit && (
          <span
            style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#333333',
              fontFamily: 'sans-serif'
            }}
          >
            {unit}
          </span>
        )}
      </div>
    </div>
  );
};

export default NumericDisplay;