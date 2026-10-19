import React, { FC, useContext, useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Tab, Box } from '@mui/material';
import { Waves, Sliders, Radio } from 'lucide-react';

import { RouterTabs, useRouterTab, useLayoutTitle } from '../components';
import { useThemeMode } from '../CustomTheme';
import TankSettingsForm from './TankSettingsForm';
import TankMqttSettingsForm from './TankMqttSettingsForm';
import TankStateWebSocketForm from './TankStateWebSocketForm';
import { AuthenticatedContext } from './../contexts/authentication';
import * as DemoApi from './api';

const DemoProject: FC = () => {
  const [deviceName, setDeviceName] = useState<string>(() => localStorage.getItem('tank_device_name') || 'Tanque de Frente');
  const { routerTab } = useRouterTab();
  const authenticatedContext = useContext(AuthenticatedContext);
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

  useEffect(() => {
    DemoApi.readBrokerSettings()
      .then(res => {
        if (res.data?.name) {
          setDeviceName(res.data.name);
          localStorage.setItem('tank_device_name', res.data.name);
        }
      })
      .catch(() => {});
  }, []);

  useLayoutTitle(deviceName);

  return (
    <Box sx={{ width: '100%', maxWidth: 1240, mx: 'auto', p: { xs: 1, sm: 2 } }}>
      <Box 
        sx={{ 
          mb: 2.5, 
          display: 'flex', 
          justifyContent: 'center',
          bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
          borderRadius: 3,
          p: 0.6,
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: isDark ? 'inset 0 1px 2px rgba(0,0,0,0.4)' : 'inset 0 1px 2px rgba(0,0,0,0.04)'
        }}
      >
        <RouterTabs value={routerTab}>
          <Tab 
            value="socket" 
            label="Sinóptico SCADA" 
            icon={<Waves size={18} />} 
            iconPosition="start"
            sx={{ 
              fontWeight: 700, 
              textTransform: 'none', 
              fontSize: '0.95rem',
              color: isDark ? '#94a3b8' : '#64748b',
              '&.Mui-selected': { color: isDark ? '#38bdf8' : '#0284c7' }
            }}
          />
          <Tab 
            value="tkcfg"  
            label="Configuración Operativa" 
            icon={<Sliders size={18} />} 
            iconPosition="start"
            disabled={!authenticatedContext.me.admin}
            sx={{ 
              fontWeight: 700, 
              textTransform: 'none', 
              fontSize: '0.95rem',
              color: isDark ? '#94a3b8' : '#64748b',
              '&.Mui-selected': { color: isDark ? '#38bdf8' : '#0284c7' }
            }}
          />
          <Tab 
            value="mqtt"   
            label="Telemetría MQTT" 
            icon={<Radio size={18} />} 
            iconPosition="start"
            sx={{ 
              fontWeight: 700, 
              textTransform: 'none', 
              fontSize: '0.95rem',
              color: isDark ? '#94a3b8' : '#64748b',
              '&.Mui-selected': { color: isDark ? '#38bdf8' : '#0284c7' }
            }}
          />
        </RouterTabs>
      </Box>
      <Routes>
        <Route path="tkcfg"  element={<TankSettingsForm />} />
        <Route path="mqtt"   element={<TankMqttSettingsForm />} />
        <Route path="socket" element={<TankStateWebSocketForm />} />
        <Route path="/*"     element={<Navigate replace to="socket" />} />
      </Routes>
    </Box>
  );
};

export default DemoProject;
