import React, { FC, useContext } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Tab, Box } from '@mui/material';
import { Waves, Sliders, Radio } from 'lucide-react';

import { RouterTabs, useRouterTab, useLayoutTitle } from '../components';
import TankSettingsForm from './TankSettingsForm';
import TankMqttSettingsForm from './TankMqttSettingsForm';
import TankStateWebSocketForm from './TankStateWebSocketForm';
import { AuthenticatedContext } from './../contexts/authentication';

const DemoProject: FC = () => {
  useLayoutTitle("Control de Agua Potable · Tanque de Frente");
  const { routerTab } = useRouterTab();
  const authenticatedContext = useContext(AuthenticatedContext);

  return (
    <>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
        <RouterTabs value={routerTab}>
          <Tab 
            value="socket" 
            label="Sinóptico SCADA" 
            icon={<Waves size={18} />} 
            iconPosition="start"
            sx={{ fontWeight: 700, textTransform: 'none', fontSize: '0.95rem' }}
          />
          <Tab 
            value="tkcfg"  
            label="Configuración Operativa" 
            icon={<Sliders size={18} />} 
            iconPosition="start"
            disabled={!authenticatedContext.me.admin}
            sx={{ fontWeight: 700, textTransform: 'none', fontSize: '0.95rem' }}
          />
          <Tab 
            value="mqtt"   
            label="Telemetría MQTT" 
            icon={<Radio size={18} />} 
            iconPosition="start"
            sx={{ fontWeight: 700, textTransform: 'none', fontSize: '0.95rem' }}
          />
        </RouterTabs>
      </Box>
      <Routes>
        <Route path="tkcfg"  element={<TankSettingsForm />} />
        <Route path="mqtt"   element={<TankMqttSettingsForm />} />
        <Route path="socket" element={<TankStateWebSocketForm />} />
        <Route path="/*"     element={<Navigate replace to="socket" />} />
      </Routes>
    </>
  );
};

export default DemoProject;
