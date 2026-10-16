import { FC, useContext, useState } from "react";
import { useSnackbar } from "notistack";

import {
  Avatar, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, List, ListItem, ListItemAvatar, ListItemText, TextField, Theme, useTheme
} from "@mui/material";
import RefreshIcon from '@mui/icons-material/Refresh';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SwapVerticalCircleIcon from '@mui/icons-material/SwapVerticalCircle';
import UpdateIcon from '@mui/icons-material/Update';
import DnsIcon from '@mui/icons-material/Dns';
import AvTimerIcon from '@mui/icons-material/AvTimer';

import * as NTPApi from "../../api/ntp";
import { NTPStatus, NTPSyncStatus } from "../../types";
import { ButtonRow, FormLoader, SectionContent } from "../../components";
import { extractErrorMessage, formatDateTime, formatDuration, formatLocalDateTime, useRest } from "../../utils";
import { AuthenticatedContext } from "../../contexts/authentication";

export const isNtpActive = ({ status }: NTPStatus) => status === NTPSyncStatus.NTP_ACTIVE;

export const ntpStatusHighlight = ({ status }: NTPStatus, theme: Theme) => {
  switch (status) {
    case NTPSyncStatus.NTP_INACTIVE:
      return theme.palette.info.main;
    case NTPSyncStatus.NTP_ACTIVE:
      return theme.palette.success.main;
    default:
      return theme.palette.error.main;
  }
};

export const ntpStatus = ({ status }: NTPStatus) => {
  switch (status) {
    case NTPSyncStatus.NTP_INACTIVE:
      return "Inactivo";
    case NTPSyncStatus.NTP_ACTIVE:
      return "Activo";
    default:
      return "Desconocido";
  }
};

const NTPStatusForm: FC = () => {
  const { loadData, data, errorMessage } = useRest<NTPStatus>({ read: NTPApi.readNTPStatus });
  const [localTime, setLocalTime] = useState<string>('');
  const [settingTime, setSettingTime] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);
  const { enqueueSnackbar } = useSnackbar();
  const { me } = useContext(AuthenticatedContext);

  const updateLocalTime = (event: React.ChangeEvent<HTMLInputElement>) => setLocalTime(event.target.value);

  const openSetTime = () => {
    setLocalTime(formatLocalDateTime(new Date()));
    setSettingTime(true);
  };

  const theme = useTheme();

  const configureTime = async () => {
    setProcessing(true);
    try {
      await NTPApi.updateTime({
        local_time: formatLocalDateTime(new Date(localTime))
      });
      enqueueSnackbar("Hora fijada correctamente", { variant: 'success' });
      setSettingTime(false);
      loadData();
    } catch (error: any) {
      enqueueSnackbar(extractErrorMessage(error, 'Error actualizando la hora'), { variant: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const renderSetTimeDialog = () => {
    return (
      <Dialog
        open={settingTime}
        onClose={() => setSettingTime(false)}
      >
        <DialogTitle>Fijar Hora</DialogTitle>
        <DialogContent dividers>
          <Box mb={2}>Indiqe la fecha y hora locales debajo para fijarlas en el dispositivo.</Box>
          <TextField
            label="Hora Local"
            type="datetime-local"
            value={localTime}
            onChange={updateLocalTime}
            disabled={processing}
            variant="outlined"
            fullWidth
            InputLabelProps={{
              shrink: true,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setSettingTime(false)} color="secondary">
            Cancelar
          </Button>
          <Button
            startIcon={<AccessTimeIcon />}
            variant="contained"
            onClick={configureTime}
            disabled={processing}
            color="primary"
            autoFocus
          >
            Fijar Hora
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const content = () => {
    if (!data) {
      return (<FormLoader onRetry={loadData} errorMessage={errorMessage} />);
    }

    return (
      <>
        <List>
          <ListItem>
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: ntpStatusHighlight(data, theme) }}>
                <UpdateIcon />
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary="Status" secondary={ntpStatus(data)} />
          </ListItem>
          <Divider variant="inset" component="li" />
          {isNtpActive(data) && (
            <>
              <ListItem>
                <ListItemAvatar>
                  <Avatar>
                    <DnsIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary="Servidor NTP" secondary={data.server} />
              </ListItem>
              <Divider variant="inset" component="li" />
            </>
          )}
          <ListItem>
            <ListItemAvatar>
              <Avatar>
                <AccessTimeIcon />
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary="Hora Local" secondary={formatDateTime(data.local_time)} />
          </ListItem>
          <Divider variant="inset" component="li" />
          <ListItem>
            <ListItemAvatar>
              <Avatar>
                <SwapVerticalCircleIcon />
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary="Hora UTC" secondary={formatDateTime(data.utc_time)} />
          </ListItem>
          <Divider variant="inset" component="li" />
          <ListItem>
            <ListItemAvatar>
              <Avatar>
                <AvTimerIcon />
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary="Tiempo activo" secondary={formatDuration(data.uptime)} />
          </ListItem>
          <Divider variant="inset" component="li" />
        </List>
        <Box display="flex" flexWrap="wrap">
          <Box flexGrow={1}>
            <ButtonRow mt={1}>
              <Button startIcon={<RefreshIcon />} variant="contained" color="secondary" onClick={loadData}>
                Actualizar
              </Button>
            </ButtonRow>
          </Box>
          {
            me.admin && data && !isNtpActive(data) && (
              <Box flexWrap="nowrap" whiteSpace="nowrap">
                <ButtonRow mt={1}>
                  <Button onClick={openSetTime} variant="contained" color="primary" startIcon={<AccessTimeIcon />}>
                    Fijar Hora
                  </Button>
                </ButtonRow>
              </Box>
            )
          }
        </Box>
        {renderSetTimeDialog()}
      </>
    );
  };

  return (
    <SectionContent title='Estado Sistema NTP' titleGutter>
      {content()}
    </SectionContent>
  );

};

export default NTPStatusForm;
