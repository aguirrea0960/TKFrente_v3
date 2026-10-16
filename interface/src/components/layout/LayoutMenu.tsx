import { FC, useContext } from 'react';
import { Divider, List } from '@mui/material';

import SettingsInputAntennaIcon from '@mui/icons-material/SettingsInputAntenna';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DeviceHubIcon from '@mui/icons-material/DeviceHub';
import SettingsIcon from '@mui/icons-material/Settings';
import LockIcon from '@mui/icons-material/Lock';
import WifiIcon from '@mui/icons-material/Wifi';

import { FeaturesContext } from '../../contexts/features';
import ProjectMenu from '../../project/ProjectMenu';
import { AuthenticatedContext } from '../../contexts/authentication';
import LayoutMenuItem from './LayoutMenuItem';

const LayoutMenu: FC = () => {
  const { features } = useContext(FeaturesContext);
  const authenticatedContext = useContext(AuthenticatedContext);

  return (
    <>
      {features.project && (
        <List disablePadding component="nav">
          <ProjectMenu />
          <Divider />
        </List>
      )}
      <List disablePadding component="nav">
        <LayoutMenuItem icon={WifiIcon} label="Conexión WiFi" to="/wifi" />
        <LayoutMenuItem icon={SettingsInputAntennaIcon} label="Punto de Acceso" to="/ap" />
        {features.ntp && (
          <LayoutMenuItem icon={AccessTimeIcon} label="Hora de Red" to="/ntp" />
        )}
        {features.mqtt && (
          <LayoutMenuItem icon={DeviceHubIcon} label="Cliente MQTT" to="/mqtt" />
        )}
        {features.security && (
          <LayoutMenuItem 
            icon={LockIcon} 
            label="Seguridad" 
            to="/security" 
            disabled={!authenticatedContext.me?.admin} 
          />
        )}
        <LayoutMenuItem icon={SettingsIcon} label="Sistema" to="/system" />
      </List>
    </>
  );
};

export default LayoutMenu;
