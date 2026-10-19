import { FC, useRef, useState } from 'react';

import * as SystemApi from "../../api/system";
import { SectionContent, MessageBox, SingleUpload, useFileUpload } from '../../components';
import { FileUploadConfig } from '../../api/endpoints';

import FirmwareRestartMonitor from './FirmwareRestartMonitor';

const UploadFSForm: FC = () => {
  const [restarting, setRestarting] = useState<boolean>(false);

  const uploadFS = useRef(async (file: File, config?: FileUploadConfig) => {
    const response = await SystemApi.uploadFS(file, config);
    setRestarting(true);
    return response;
  });

  const [uploadFile, cancelUpload, uploading, uploadProgress] = useFileUpload({ upload: uploadFS.current });

  return (
    <SectionContent title='Cargar Sistema de Archivos' titleGutter>
      {restarting ? (
        <FirmwareRestartMonitor />
      ) : (
        <>
          <MessageBox
            message="Cargar imagen del filesystem (.bin) para reemplazar el sistema de archivos. El dispositivo reiniciará automáticamente."
            level="warning"
            my={2}
          />
          <SingleUpload
            accept={{ 'application/octet-stream': ['.bin'] }}
            onDrop={uploadFile}
            onCancel={cancelUpload}
            uploading={uploading}
            progress={uploadProgress}
          />
        </>
      )}
    </SectionContent>
  );
};

export default UploadFSForm;
