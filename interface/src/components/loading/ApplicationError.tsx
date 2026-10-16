import { FC } from 'react';

import { Box, Paper, Typography } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';

interface ApplicationErrorProps {
  message?: string;
}

const ApplicationError: FC<ApplicationErrorProps> = ({ message }) => (
  <Box display="flex" height="100vh" justifyContent="center" flexDirection="column">
    <Paper
      elevation={10}
      sx={{
        textAlign: "center",
        padding: "280px 0 40px 0",
        backgroundImage: 'url("/app/alarm.png")',
        backgroundRepeat: "no-repeat",
        backgroundPosition: "50% 40px",
        backgroundSize: "200px auto",
        width: "100%",
        borderRadius: 0
      }}
    >
      <Box display="flex" flexDirection="row" justifyContent="center" alignItems="center" mb={2}>
        <WarningIcon fontSize="large" color="error" />
        <Box ml={2}>
          <Typography variant="h4">
            Error en Aplicación
          </Typography>
        </Box>
      </Box>
      <Typography variant="subtitle1" gutterBottom>
        Error al configurar aplicación, favor refrescar e intente nuevamente.
      </Typography>
      {
        message &&
        (
          <Typography variant="subtitle2" gutterBottom>
            {message}
          </Typography>
        )
      }
    </Paper>
  </Box>
);

export default ApplicationError;
