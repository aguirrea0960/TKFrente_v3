import { FC, Fragment } from 'react';
import { useDropzone, DropzoneState, Accept } from 'react-dropzone';
import { Box, Button, LinearProgress, Theme, Typography, useTheme } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import MemoryIcon from '@mui/icons-material/Memory';
import CancelIcon from '@mui/icons-material/Cancel';
import { AxiosProgressEvent } from 'axios';
import { useTranslation } from 'react-i18next';

const progressPercentage = (progress?: AxiosProgressEvent) => {
  if (!progress || !progress.loaded || !progress.total) {
    return 0;
  }
  return Math.min(100, Math.round((progress.loaded * 100) / progress.total));
};

const getBorderColor = (theme: Theme, props: DropzoneState) => {
  if (props.isDragAccept) {
    return theme.palette.success.main;
  }
  if (props.isDragReject) {
    return theme.palette.error.main;
  }
  if (props.isDragActive) {
    return theme.palette.info.main;
  }
  return theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';
};

export interface SingleUploadProps {
  onDrop: (acceptedFiles: File[]) => void;
  onCancel: () => void;
  accept?: Accept;
  uploading: boolean;
  progress?: AxiosProgressEvent;
}

const SingleUpload: FC<SingleUploadProps> = ({
  onDrop,
  onCancel,
  accept,
  uploading,
  progress
}) => {
  const { t } = useTranslation();
  const dropzoneState = useDropzone({ onDrop, accept, disabled: uploading, multiple: false });
  const { getRootProps, getInputProps } = dropzoneState;
  const theme = useTheme();

  const percent = progressPercentage(progress);
  const isFlashing = uploading && (percent >= 100 || (progress && progress.loaded === progress.total));

  return (
    <Box
      {...getRootProps({
        sx: {
          py: 6,
          px: 3,
          borderWidth: 2,
          borderRadius: 3,
          borderStyle: 'dashed',
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
          transition: 'all .24s ease-in-out',
          width: '100%',
          cursor: uploading ? 'default' : 'pointer',
          borderColor: getBorderColor(theme, dropzoneState),
          '&:hover': {
            borderColor: uploading ? undefined : theme.palette.primary.main,
            bgcolor: uploading ? undefined : (theme.palette.mode === 'dark' ? 'rgba(56, 189, 248, 0.04)' : 'rgba(2, 136, 209, 0.04)')
          }
        }
      })}
    >
      <input {...getInputProps()} />
      <Box flexDirection="column" display="flex" alignItems="center" textAlign="center" gap={1.5}>
        {isFlashing ? (
          <MemoryIcon sx={{ fontSize: 52, color: theme.palette.warning.main, animation: 'pulse 1.5s infinite ease-in-out' }} />
        ) : (
          <CloudUploadIcon sx={{ fontSize: 52, color: theme.palette.primary.main }} />
        )}

        <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
          {!uploading && t('upload.drop_or_click', 'Suelte el archivo .bin aquí o haga clic para examinar')}
          {uploading && !isFlashing && (
            progress?.lengthComputable
              ? t('upload.uploading_percent', { percent, defaultValue: "Transmitiendo archivo: " + percent + "%" })
              : t('upload.uploading', 'Subiendo archivo...')
          )}
          {isFlashing && 'Grabando en memoria Flash SPI...'}
        </Typography>

        <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 460 }}>
          {!uploading && 'Compatible con binarios de firmware (.bin) o filesystem LittleFS'}
          {uploading && !isFlashing && progress?.total && (
            ((progress.loaded / 1024).toFixed(0)) + " KB de " + ((progress.total / 1024).toFixed(0)) + " KB transmitidos"
          )}
          {isFlashing && 'Por favor espere. El microcontrolador está programando los sectores de la Flash interna y se reiniciará automáticamente.'}
        </Typography>

        {uploading && (
          <Fragment>
            <Box width="100%" maxWidth={500} mt={1}>
              <LinearProgress
                color={isFlashing ? "warning" : "primary"}
                variant={isFlashing || !progress?.lengthComputable ? "indeterminate" : "determinate"}
                value={percent}
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>
            {!isFlashing && (
              <Button
                startIcon={<CancelIcon />}
                variant="outlined"
                color="secondary"
                size="small"
                sx={{ mt: 1.5 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel();
                }}
              >
                {t('common.cancel', 'Cancelar')}
              </Button>
            )}
          </Fragment>
        )}
      </Box>
    </Box>
  );
};

export default SingleUpload;
