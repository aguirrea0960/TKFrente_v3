import React, { FC, useContext } from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';

import { Tab } from '@mui/material';

import { useRouterTab, RouterTabs, useLayoutTitle, RequireAdmin } from '../../components';
import { AuthenticatedContext } from '../../contexts/authentication';
import { FeaturesContext } from '../../contexts/features';
import UploadFirmwareForm from './UploadFirmwareForm';
import UploadFSForm from './UploadFSForm';
import SystemStatusForm from './SystemStatusForm';
import DiagnosticsForm from './DiagnosticsForm';

const System: FC = () => {
  useLayoutTitle("Sistema");

  const { me } = useContext(AuthenticatedContext);
  const { features } = useContext(FeaturesContext);
  const { routerTab } = useRouterTab();

  return (
    <>
      <RouterTabs value={routerTab}>
        <Tab value="status" label="Estado del Sistema" />
        <Tab value="diagnostics" label="Diagnóstico" />
        {features.upload_firmware && (
          <Tab value="upload" label="Cargar Firmware" disabled={!me.admin} />
        )}
        {features.upload_firmware && (
          <Tab value="upload_fs" label="Cargar Filesystem" disabled={!me.admin} />
        )}
      </RouterTabs>
      <Routes>
        <Route path="status" element={<SystemStatusForm />} />
        <Route path="diagnostics" element={<DiagnosticsForm />} />
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
        {features.upload_firmware && (
          <Route
            path="upload_fs"
            element={
              <RequireAdmin>
                <UploadFSForm />
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
