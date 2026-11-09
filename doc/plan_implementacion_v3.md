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
# Compilar firmware ESP32-C3 actual (envESP32_C3L-WiFi):
pio run -e envESP32_C3L-WiFi

# Compilar sistema de archivos LittleFS (interfaz web):
pio run -e envESP32_C3L-WiFi -t buildfs
```

---

## 5. Mejoras de Telemetría y Temas (Octubre 2026)

1. **Prevención de Bloqueo y Congelamiento WebSocket**:
   - `IOMonitor()` incorpora un heartbeat de 1000 ms garantizando flujo continuo de telemetría hacia los navegadores web.
   - Seguimiento explícito de conmutación de válvulas solenoides (`cmdfill`, `sov1On`, `sov2On`) para refresco instantáneo en la UI.
2. **Estabilización de Bomba de Llenado (`pollPumpStatus`)**:
   - Reducción del timeout HTTP a 400 ms para eliminar latencias en el bucle principal.
   - Filtro de 3 reintentos fallidos consecutivos para evitar parpadeos `OFFLINE` espurios.
3. **Unificación de Temas Light / Dark**:
   - Estados inferiores de `MV01`, `BOMBA` y `LLENANDO TANQUE` mantienen el verde brillante (`#39ff14`) en Dark Mode y conmutan al gris suave (`#64748b`) en Light Mode, logrando coherencia visual con el Cabezal de Distribución.

---

## 6. Protección de Llenado e Inhibición por Flujo Estable (Noviembre 2026)

1. **Inhibición de Protección por Flujo Estable de Bomba**:
   - Condición de flujo: `isPumpOnline && isPumpRunning && !isPumpFail`.
   - Cuando la bomba de llenado confirma marcha continua sin falla de agua (PressControl en régimen estable), el temporizador de falla de agua (`waterFailTicks`) se resetea a 0 y la protección se inhibe completamente, garantizando que la electroválvula `SOV1` no se cierre involuntariamente durante el llenado.
2. **Temporizador Configurable de Detección de Falla de Agua (`water_fail_time`)**:
   - Se incorporó el parámetro `water_fail_time` (por defecto: 30 segundos) en `TankSettingsService` y en el formulario web `TankSettingsForm`.
   - Si la válvula de llenado está abierta pero la bomba pierde flujo o entra en falla sostenida por un tiempo superior a `water_fail_time`, la protección desenergiza `SOV1` (y cierra `MV01` si estaba en recirculación), restableciendo el estado a `TS_IDLE`.
3. **Optimización de Interfaz HMI (Supresión de Advertencia)**:
   - En `TankStateWebSocketForm`, al solicitar inicio de llenado (`cmd_fill`), si la bomba se encuentra en marcha activa (`data.pump_running && !data.pump_fail`), se omite automáticamente el diálogo modal de confirmación, permitiendo el arranque instantáneo en un solo paso.

---

## 7. Persistencia NV, Protección de Recirculación y Optimización MQTT (Noviembre 2026)

1. **Reanudación Segura de Llenado tras Corte AC o Reinicio (NVS Preferences)**:
   - Persistencia del estado `cmdfill` en el namespace `tk_nv`, clave `filling`.
   - En el arranque (`setup()`), no se abre la válvula a ciegas: se inicia una ventana de sincronización de 20 segundos (`pendingNvFillRecovery`).
   - Solo cuando el enlace con la Bomba de Llenado (`192.168.10.193`) responde confirmando marcha activa sin fallas (`isPumpRunning && !isPumpFail`) y el sensor `HLS` no está en tope, se reanuda automáticamente el llenado. Si la bomba está apagada, en fallo o vence el timeout, se anula la maniobra y se apaga la bandera.
2. **Inmunización Absoluta de la Recirculación (Cebado y Purga)**:
   - Se añadió `isRecirculating()` en `TankStateService.h`.
   - Durante las maniobras de recirculación (`TS_REC_25` o `TS_REC_50`), la protección por falla de agua se inhibe totalmente (`!isRecircActive`), permitiendo al usuario purgar aire y cebar la succión sin que el sistema cierre intempestivamente `SOV1` ni `MV01`.
   - Se habilitó la conmutación directa e instantánea desde `TS_FILL` hacia recirculación sin bloqueos.
3. **Distribución P&ID en Fila Única Continua y Cajas de Ancho Fijo**:
   - En `TankStateWebSocketForm.tsx`, los 4 bloques (`Suministro`, `Tanque+HLS`, `Succión Bomba` y `Cabezal de Distribución`) se alinean horizontalmente en una sola fila continua (~860 px requeridos en un contenedor de 1200 px).
   - Anchos fijos e invariables (`width: 175px`, `320px`, `215px`), evitando cualquier alteración o parpadeo horizontal al variar la longitud de los mensajes de estado.
4. **Erradicación del Tráfico Repetitivo MQTT (Reporte Estricto por Hardware)**:
   - Se eliminó el `heartbeatDue` de 1000 ms y los contadores de software (`time_vsoper`, `time_rem`) del evaluador de cambios de estado.
   - El microcontrolador solo emite eventos MQTT **SI Y SOLO SI** se produce un cambio físico real en el hardware (contactores, boyas, relés, nivel o bombas). Si no hay cambios, el estado permanece en `UNCHANGED` y el tráfico MQTT es nulo, liberando los búferes TCP y eliminando la latencia en las peticiones HTTP.
5. **Configuración de Fábrica Unificada**:
   - **Broker MQTT Remoto**: `165.22.145.161` (puerto `1883`), usuario `admin`.
   - **Tópico de Tanques**: `water/tank/tk-#{short_id}` y Client ID `tk-#{short_id}`, donde `#{short_id}` extrae los **últimos 2 bytes de la MAC** en hexadecimal (4 caracteres, ej. `3640`).
   - **Zona Horaria**: `America/Caracas` con formato POSIX `UNK4`, alineado con la definición del frontend (`TZ.tsx`).


