import React from 'react';

interface IndustrialSwitchProps {
  label: string;
  isOn: boolean;
  onChange: (state: boolean) => void;
}

export const IndustrialSwitch: React.FC<IndustrialSwitchProps> = ({
  label,
  isOn,
  onChange
}) => {
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
        width: '90px'
      }}
    >
      <span
        style={{
          fontSize: '10px',
          fontWeight: '900',
          color: '#444',
          marginBottom: '10px',
          fontFamily: 'monospace',
          letterSpacing: '1px'
        }}
      >
        {label.toUpperCase()}
      </span>
      <div
        onClick={() => onChange(!isOn)}
        style={{
          width: '50px',
          height: '26px',
          backgroundColor: isOn ? '#39ff14' : '#666',
          borderRadius: '13px',
          padding: '2px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isOn ? 'flex-end' : 'flex-start',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
          transition: 'background-color 0.3s ease'
        }}
      >
        <div
          style={{
            width: '22px',
            height: '22px',
            backgroundColor: '#fff',
            borderRadius: '50%',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 -2px 2px rgba(0,0,0,0.1)',
            transition: 'all 0.2s ease'
          }}
        />
      </div>
      <span
        style={{
          fontSize: '9px',
          marginTop: '6px',
          fontWeight: 'bold',
          color: isOn ? '#008000' : '#444'
        }}
      >
        {isOn ? 'ON' : 'OFF'}
      </span>
    </div>
  );
};

export default IndustrialSwitch;
 