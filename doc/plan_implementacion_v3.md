# Especificación y Estado de Arquitectura
## Proyecto: TKFrente_v3 (Control de Agua Potable v3.0)

**Última Actualización**: 28 de Septiembre de 2026  
**Hardware Principal**: ESP32-S3 (`esp32-s3-devkitc-1`)  
**Plataforma PlatformIO**: `espressif32 @6.11.0` (Arduino Core 2.0.17 / ESP-IDF v4.4)  
**Entorno de Compilación**: `[env:esp32s3]` (PlatformIO)  
**Frontend**: React 18.3, TypeScript 5.9, Vite 7.3, Material-UI (MUI) v7, Emotion, Lucide Icons  
**Bomba Asociada**: `ReactPumpControl_V1` (`pump_host`)  

---

## 1. Alcance y Decisiones de Diseño v3.0

1. **Migración a Vite 7**: Arquitectura basada en **Vite 7** (`@vitejs/plugin-react-swc`), con compatibilidad de variables de entorno seguras (`import.meta.env` y polyfill de `process.env`), Hot Module Replacement (HMR) y proxy de desarrollo configurado hacia el ESP32.
2. **Eliminación Total del Sensor de Bajo Nivel (LLS)**:
   - El tanque ya **no utiliza** boya ni sensor físico/virtual de bajo nivel (LLS).
   - Se removió toda referencia a LLS en el firmware (`TankStateService`, `TankSettingsService`, `main.cpp`) y en el frontend (`TankStateWebSocketForm`, `TankSettingsForm`, `types.ts`).
   - El control de llenado está regido exclusivamente por el sensor de **Alto Nivel (HLS)**, el cual apaga la solenoide `SOV1`, cancela el comando de llenado y pone el estado en `TS_FULL`.
3. **Indicador de Nivel Continuo sin Cálculo de Litros**:
   - Como la geometría del tanque **no es cilíndrica**, no se calcula ni se estima volumen volumétrico lineal en litros.
   - El visualizador central HMI (`TankLevelIndicator`) y la telemetría operan estrictamente en porcentaje de altura (`0.0% - 100.0%`), medido continuamente por el sensor ultrasónico impermeable AJ-SR04M.
4. **Detección Dinámica de IP de Dispositivo**:
   - En el encabezado del SCADA, la dirección IP del nodo se resuelve dinámicamente vía `WiFiApi.readWiFiStatus()` y `window.location.hostname` (se eliminó la IP hardcodeada `192.168.10.190`).
5. **Plataforma Espressif32 6.11.0 para ESP32-S3**:
   - Se actualizó el entorno `[env:esp32s3]` a `espressif32 @6.11.0`.
   - Se blindó `scripts/build_interface.py` para aislar la salida Unicode de Vite (`✓`) y evitar fallos por codificación `cp1252` en entornos Windows.

---

## 2. Asignación de Hardware y Mapeo de Señales (ESP32-S3)

| Identificador C++ | Pin ESP32-S3 | Dirección | Función Operativa |
|---|---|---|---|
| `_pinSOV1` | GPIO 12 | Salida Digital | Válvula solenoide de llenado (red pública) |
| `_pinSOV2` | GPIO 13 | Salida Digital | Válvula solenoide de riego de jardín |
| `_pinMV01_CCW` | GPIO 19 | Salida Digital | Dirección válvula motorizada servicio (Relé DPDT: HIGH=Abrir, LOW=Cerrar) |
| `_pinMV01_ON` | GPIO 18 | Salida Digital | Alimentación motor válvula motorizada MV01 |
| `_pinMV01_SW_OPEN` | GPIO 6 | Entrada (Pull-up) | Microswitch fin de carrera 100% abierta (Activo LOW) |
| `_pinMV01_SW_CLOSE` | GPIO 10 | Entrada (Pull-up) | Microswitch fin de carrera 100% cerrada (Activo LOW) |
| `_pinHLS` | GPIO 4 | Entrada (Pull-up) | Sensor boya de alto nivel (corte de llenado) |
| `Serial0 / USB-CDC` | UART / CDC | Serial Monitor | Debug y telemetría (115200 bps) |
| `Serial1` | GPIO 1 (RX) / 0 (TX) | UART 9600 bps | Sensor de distancia ultrasónico impermeable AJ-SR04M |

---

## 3. Matriz de Estados y Contrato WebSocket (`/ws/devState`)

### Payload `TankState`

```typescript
export interface TankState {
  sov1_on: boolean;    // Solenoide de llenado activa
  sov2_on: boolean;    // Solenoide de riego activa
  hl_on: boolean;      // Nivel alto alcanzado (Boya HLS)
  level: number;       // Nivel continuo ultrasónico (0.0% - 100.0%)
  cmd_fill: boolean;   // Comando: Iniciar / detener llenado
  cmd_serv: boolean;   // Comando: Servir agua a la casa (abre MV01 y pulsa bomba)
  cmd_rieg: boolean;   // Comando: Iniciar / detener riego de jardín
  cmd_rec50: boolean;  // Comando: Recircular al 50% de apertura para cebado
  cmd_rec25: boolean;  // Comando: Recircular al 25% de apertura para estrangulado
  state: number;       // Estado general del sistema
  vs_state: number;    // Estado de la válvula motorizada de servicio
  time_rem: number;    // Segundos restantes de temporizador activo (riego)
  time_vsoper: number; // Segundos acumulados de maniobra de válvula motorizada
}
```

### Decodificación de Estados (`state`)
- `0`: **Tanque Vacío** (`TS_EMPTY`)
- `1`: **Disponible / En Espera** (`TS_IDLE`)
- `2`: **Llenando Tanque** (`TS_FILL`)
- `3`: **Sirviendo Agua a la Casa** (`TS_SERV`)
- `4`: **Tanque Lleno** (`TS_FULL`)
- `6`: **Recirculación 50% Abriendo** (`TS_REC_50`)
- `7`: **Recirculación 25% Abriendo** (`TS_REC_25`)
- `8`: **Recirculación 50% Cerrando** (`TS_REC_50C`)
- `9`: **Recirculación 25% Cerrando** (`TS_REC_25C`)

### Decodificación Válvula de Servicio (`vs_state`)
- `0`: **En Tránsito / Moviéndose** (`VS_MOVING`) - Amarillo
- `1`: **100% Abierta** (`VS_OPEN`) - Verde
- `2`: **100% Cerrada** (`VS_CLOSED`) - Rojo
- `3`: **Posición Indeterminada / Inicio** (`VS_INIT`) - Naranja
- `4`: **Recirculación Parcial** (`VS_RECIRC`) - Azul / Cian

---

## 4. Pipeline de Compilación y Comandos Operativos

### Modo Desarrollo Frontend (Vite HMR)
```bash
cd interface
npm run dev
# URL Local: http://localhost:3000/
# Las llamadas REST y WebSocket se redirigen al ESP mediante proxy (vite.config.ts)
```

### Compilación Frontend de Producción
```bash
cd interface
npm run build
# Ejecuta validación estricta de tipos (tsc -b) y empaquetado optimizado (vite build)
```

### Compilación y Carga de Firmware (PlatformIO)
```bash
# Compilar firmware ESP32-S3 (incluye build de interface automático y compresión gzip hacia LittleFS):
pio run -e esp32s3

# Cargar firmware al microcontrolador:
pio run -e esp32s3 -t upload

# Cargar sistema de archivos LittleFS (interfaz web comprimida):
pio run -e esp32s3 -t uploadfs
```
