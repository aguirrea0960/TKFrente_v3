import { FC } from "react";

import { Avatar, Button, Divider, List, ListItem, ListItemAvatar, ListItemText, Theme, useTheme } from "@mui/material";
import DeviceHubIcon from '@mui/icons-material/DeviceHub';
import RefreshIcon from '@mui/icons-material/Refresh';
import ReportIcon from '@mui/icons-material/Report';

import * as MqttApi from "../../api/mqtt";
import { MqttStatus, MqttDisconnectReason } from "../../types";
import { ButtonRow, FormLoader, SectionContent } from "../../components";
import { useRest } from "../../utils";

export const mqttStatusHighlight = ({ enabled, connected }: MqttStatus, theme: Theme) => {
  if (!enabled) {
    return theme.palette.info.main;
  }
  if (connected) {
    return theme.palette.success.main;
  }
  return theme.palette.error.main;
};

export const mqttStatus = ({ enabled, connected }: MqttStatus) => {
  if (!enabled) {
    return "Deshabilitado";
  }
  if (connected) {
    return "Conectado";
  }
  return "Desconectado";
};

export const disconnectReason = ({ disconnect_reason }: MqttStatus) => {
  switch (disconnect_reason) {
    case MqttDisconnectReason.TCP_DISCONNECTED:
      return "Socket TCP desconectado";
    case MqttDisconnectReason.MQTT_UNACCEPTABLE_PROTOCOL_VERSION:
      return "Versión de Protocolo inválida";
    case MqttDisconnectReason.MQTT_IDENTIFIER_REJECTED:
      return "ID de Cliente Rechazado";
    case MqttDisconnectReason.MQTT_SERVER_UNAVAILABLE:
      return "Servidor no disponible";
    case MqttDisconnectReason.MQTT_MALFORMED_CREDENTIALS:
      return "credenciales inválidas";
    case MqttDisconnectReason.MQTT_NOT_AUTHORIZED:
      return "No autorizado";
    case MqttDisconnectReason.ESP8266_NOT_ENOUGH_SPACE:
      return "Memoria baja en Dispositivo";
    case MqttDisconnectReason.TLS_BAD_FINGERPRINT:
      return "Huella de servidor inválida";
    default:
      return "Desconocida";
  }
};

const MqttStatusForm: FC = () => {
  const { loadData, data, errorMessage } = useRest<MqttStatus>({ read: MqttApi.readMqttStatus });

  const theme = useTheme();

  const content = () => {
    if (!data) {
      return (<FormLoader onRetry={loadData} errorMessage={errorMessage} />);
    }

    const renderConnectionStatus = () => {
      if (data.connected) {
        return (
          <>
            <ListItem>
              <ListItemAvatar>
                <Avatar>#</Avatar>
              </ListItemAvatar>
              <ListItemText primary="ID de Cliente" secondary={data.client_id} />
            </ListItem>
            <Divider variant="inset" component="li" />
          </>
        );
      }
      return (
        <>
          <ListItem>
            <ListItemAvatar>
              <Avatar>
                <ReportIcon />
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary="Razón de Desconección" secondary={disconnectReason(data)} />
          </ListItem>
          <Divider variant="inset" component="li" />
        </>
      );
    };

    return (
      <>
        <List>
          <ListItem>
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: mqttStatusHighlight(data, theme) }}>
                <DeviceHubIcon />
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary="Estado" secondary={mqttStatus(data)} />
          </ListItem>
          <Divider variant="inset" component="li" />
          {data.enabled && renderConnectionStatus()}
        </List >
        <ButtonRow pt={1}>
          <Button startIcon={<RefreshIcon />} variant="contained" color="secondary" onClick={loadData}>
            Actualizar
          </Button>
        </ButtonRow>
      </>
    );
  };

  return (
    <SectionContent title='Estado MQTT' titleGutter>
      {content()}
    </SectionContent>
  );

};

export default MqttStatusForm;
