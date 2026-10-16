import React, { FC, useContext } from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';

import { Tab } from '@mui/material';

import { useRouterTab, RouterTabs, useLayoutTitle, RequireAdmin } from '../../components';
import { AuthenticatedContext } from '../../contexts/authentication';
import { FeaturesContext } from '../../contexts/features';
import UploadFirmwareForm from './UploadFirmwareForm';
import SystemStatusForm from './SystemStatusForm';
import OTASettingsForm from './OTASettingsForm';

const System: FC = () => {
  useLayoutTitle("Sistema");

  const { me } = useContext(AuthenticatedContext);
  const { features } = useContext(FeaturesContext);
  const { routerTab } = useRouterTab();

  return (
    <>
      <RouterTabs value={routerTab}>
        <Tab value="status" label="Estado del Sistema" />
        {features.ota && (
          <Tab value="ota" label="Configuración OTA" disabled={!me.admin} />
        )}
        {features.upload_firmware && (
          <Tab value="upload" label="Cargar Firmware" disabled={!me.admin} />
        )}
      </RouterTabs>
      <Routes>
        <Route path="status" element={<SystemStatusForm />} />
        {features.ota && (
          <Route
            path="ota"
            element={
              <RequireAdmin>
                <OTASettingsForm />
              </RequireAdmin>
            }
          />
        )}
        {features.upload_firmware && (
          <Route
            path="upload"
            element={
              <RequireAdmin>
                <UploadFirmwareForm />
              </RequireAdmin>
            }
          />
        )}
        <Route path="/*" element={<Navigate replace to="status" />} />
      </Routes>
    </>
  );

};

export default System;
