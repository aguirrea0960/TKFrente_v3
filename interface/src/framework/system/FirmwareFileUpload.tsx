import { AxiosPromise } from 'axios';
import { FC } from 'react';

import { FileUploadConfig } from '../../api/endpoints';
import { MessageBox, SingleUpload, useFileUpload } from '../../components';

interface UploadFirmwareProps {
  uploadFirmware: ((file: File, config?: FileUploadConfig) => AxiosPromise<void>);
}

const FirmwareFileUpload: FC<UploadFirmwareProps> = ({ uploadFirmware }) => {
  const [uploadFile, cancelUpload, uploading, uploadProgress] = useFileUpload({ upload: uploadFirmware });

  return (
    <>
      <MessageBox
        message="¡Atención! La carga de un firmware incorrecto puede deshabilitar el dispositivo."
        level="warning"
        my={2}
      />
      <SingleUpload
        accept={{
          'application/octet-stream': ['.bin']
        }}
        onDrop={uploadFile}
        onCancel={cancelUpload}
        uploading={uploading}
        progress={uploadProgress}
      />
    </>
  );
};

export default FirmwareFileUpload;
