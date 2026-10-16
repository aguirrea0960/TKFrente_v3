import React from 'react';

interface AnnunciatorGroupProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  title?: string;
}

export const AnnunciatorGroup: React.FC<AnnunciatorGroupProps> = ({
  children,
  orientation = 'horizontal',
  title
}) => {
  return (
    <div
      style={{
        border: '1px solid #bcbcbc',
        padding: '12px',
        backgroundColor: '#f5f5f5',
        borderRadius: '6px',
        boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.8), 0 2px 4px rgba(0,0,0,0.05)',
        width: 'fit-content',
        display: 'inline-block'
      }}
    >
      {title && (
        <h4
          style={{
            margin: '0 0 12px 0',
            fontSize: '11px',
            color: '#666',
            fontFamily: 'monospace',
            borderBottom: '1px solid #ddd',
            paddingBottom: '4px',
            textAlign: orientation === 'vertical' ? 'center' : 'left'
          }}
        >
          {title.toUpperCase()}
        </h4>
      )}
      <div
        style={{
          display: 'flex',
          flexDirection: orientation === 'horizontal' ? 'row' : 'column',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {children}
      </div>
    </div>
  );
};
