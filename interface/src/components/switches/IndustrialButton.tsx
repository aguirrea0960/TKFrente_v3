import React from 'react';
import { useThemeMode } from '../../CustomTheme';

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
  disabled = false
}) => {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

  const bgColor = color === 'red' ? '#dc2626' : color === 'green' ? '#16a34a' : '#0284c7';
  const activeColor = color === 'red' ? '#b91c1c' : color === 'green' ? '#15803d' : '#0369a1';
  const finalBgColor = disabled ? (isDark ? '#475569' : '#94a3b8') : bgColor;

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '12px',
        background: isDark
          ? 'linear-gradient(145deg, #182234 0%, #0f172a 100%)'
          : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '8px',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #cbd5e1',
        boxShadow: isDark
          ? 'inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 4px 12px rgba(0, 0, 0, 0.4)'
          : '0 2px 8px rgba(0, 0, 0, 0.06)',
        width: '106px',
        opacity: disabled ? 0.65 : 1,
        transition: 'all 0.3s ease'
      }}
    >
      <button
        onClick={!disabled ? onClick : undefined}
        disabled={disabled}
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: finalBgColor,
          backgroundImage: disabled 
            ? 'none' 
            : `radial-gradient(circle at 32% 32%, rgba(255,255,255,0.35), transparent 60%)`,
          boxShadow: disabled 
            ? (isDark ? '0 2px 0 #1e293b' : '0 2px 0 #cbd5e1')
            : (isDark ? '0 4px 0 #000, 0 6px 12px rgba(0,0,0,0.5)' : '0 4px 0 #64748b, 0 6px 10px rgba(0,0,0,0.2)'),
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.1s',
          pointerEvents: disabled ? 'none' : 'auto'
        }}
        onMouseDown={(e) => {
          if (disabled) return;
          e.currentTarget.style.transform = 'translateY(3px)';
          e.currentTarget.style.boxShadow = isDark ? '0 1px 0 #000, 0 2px 5px rgba(0,0,0,0.4)' : '0 1px 0 #64748b, 0 2px 4px rgba(0,0,0,0.2)';
          e.currentTarget.style.backgroundColor = activeColor;
        }}
        onMouseUp={(e) => {
          if (disabled) return;
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = isDark ? '0 4px 0 #000, 0 6px 12px rgba(0,0,0,0.5)' : '0 4px 0 #64748b, 0 6px 10px rgba(0,0,0,0.2)';
          e.currentTarget.style.backgroundColor = bgColor;
        }}
      >
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            border: disabled 
                ? '2px solid rgba(0,0,0,0.1)' 
                : '2px solid rgba(255,255,255,0.25)'
          }}
        />
      </button>
      <span
        style={{
          fontSize: '10px',
          fontWeight: '900',
          color: disabled ? (isDark ? '#64748b' : '#94a3b8') : (isDark ? '#cbd5e1' : '#334155'),
          marginTop: '10px',
          fontFamily: 'monospace',
          textAlign: 'center',
          letterSpacing: '0.5px'
        }}
      >
        {label.toUpperCase()}
      </span>
    </div>
  );
};

export default IndustrialButton;
