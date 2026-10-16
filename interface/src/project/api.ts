import { AxiosPromise } from "axios";
import { AXIOS } from "../api/endpoints";
import { TankMqttSettings, TankState, TankSettings } from "./types";

export function readTankState(): AxiosPromise<TankState> {
  return AXIOS.get('/devState');
}

export function updateTankState(tankState: TankState): AxiosPromise<TankState> {
  return AXIOS.post('/devState', tankState);
}

export function readBrokerSettings(): AxiosPromise<TankMqttSettings> {
  return AXIOS.get('/brokerSettings');
}

export function updateBrokerSettings(tankMqttSettings: TankMqttSettings): AxiosPromise<TankMqttSettings> {
  return AXIOS.post('/brokerSettings', tankMqttSettings);
}

export function readTankSettings(): AxiosPromise<TankSettings> {
  return AXIOS.get('/tankSettings');
}

export function updateTankSettings(tankSettings: TankSettings): AxiosPromise<TankSettings> {
  return AXIOS.post('/tankSettings', tankSettings);
}
