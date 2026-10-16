# ============================================================
# TKFrente_v3 - Build Manager (Vite 7 + React 18 + PlatformIO)
# ============================================================

$PIO = "$env:USERPROFILE\.platformio\penv\Scripts\pio.exe"
$INTERFACE_DIR = Join-Path $PSScriptRoot "interface"

# Menu de seleccion de Hardware
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   TKFrente_v3 - Seleccion de Hardware" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  1. ESP32-S3 (Placa de Pruebas / USB Nativo)"
Write-Host "  2. ESP32-C3 (Produccion / OTA WiFi 192.168.10.190)"
Write-Host "============================================"
$hwOption = Read-Host "Selecciona el hardware objetivo [1 o 2, por defecto 1]"

if ($hwOption -eq "2") {
    $ENV_NAME = "envESP32_C3L-WiFi"
    Write-Host "Hardware seleccionado: ESP32-C3 (OTA WiFi)" -ForegroundColor Yellow
} else {
    $ENV_NAME = "esp32s3"
    Write-Host "Hardware seleccionado: ESP32-S3 (USB CDC Nativo)" -ForegroundColor Yellow
}

function Build-Frontend {
    Write-Host "`n[FRONTEND] Compilando interfaz moderna con Vite 7..." -ForegroundColor Cyan
    Push-Location $INTERFACE_DIR
    npm run build
    Pop-Location
    Write-Host "[FRONTEND] Listo." -ForegroundColor Green
    Write-Host "`n[FS] Generando imagen LittleFS con gzip..." -ForegroundColor Cyan
    $env:REACT_SKIP_UI = "1"
    & $PIO run -e $ENV_NAME --target buildfs
    $env:REACT_SKIP_UI = $null
    Write-Host "[FS] Imagen LittleFS generada con exito." -ForegroundColor Green
}

function Build-Backend {
    Write-Host "`n[BACKEND] Compilando firmware para $ENV_NAME..." -ForegroundColor Cyan
    $env:REACT_SKIP_UI = "1"
    & $PIO run -e $ENV_NAME
    $env:REACT_SKIP_UI = $null
    Write-Host "[BACKEND] Firmware compilado con exito." -ForegroundColor Green
}

function Build-Both {
    Write-Host "`n[AMBOS] Compilando Frontend (Vite) + Firmware ($ENV_NAME)..." -ForegroundColor Cyan
    Build-Frontend
    Build-Backend
    Write-Host "[AMBOS] Todo compilado con exito." -ForegroundColor Green
}

function Upload-FS {
    Write-Host "`n[FS] Flasheando Filesystem (LittleFS) en $ENV_NAME..." -ForegroundColor Cyan
    & $PIO run -e $ENV_NAME --target uploadfs
    Write-Host "[FS] Filesystem subido." -ForegroundColor Green
}

function Upload-Firmware {
    Write-Host "`n[FW] Flasheando Firmware en $ENV_NAME..." -ForegroundColor Cyan
    & $PIO run -e $ENV_NAME --target upload
    Write-Host "[FW] Firmware subido." -ForegroundColor Green
}

function Upload-All {
    Build-Both
    Upload-FS
    Upload-Firmware
    Write-Host "[COMPLETO] Sistema v3.0 instalado en el ESP32." -ForegroundColor Green
}

# --- MENU OPERATIVO ---
Write-Host "`n============================================" -ForegroundColor Yellow
Write-Host "   TKFrente_v3 - Accion a ejecutar [$ENV_NAME]" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "  1. Solo FRONTEND (Vite 7 + LittleFS Image)"
Write-Host "  2. Solo BACKEND (Firmware C++)"
Write-Host "  3. AMBOS (Frontend + Firmware)"
Write-Host "  4. Subir Filesystem LittleFS (Upload FS)"
Write-Host "  5. Subir Firmware (Upload FW)"
Write-Host "  6. TODO (Build Ambos + Upload FS + Upload FW)"
Write-Host "============================================"

$opcion = Read-Host "Selecciona una opcion [1-6]"

switch ($opcion) {
    "1" { Build-Frontend }
    "2" { Build-Backend }
    "3" { Build-Both }
    "4" { Upload-FS }
    "5" { Upload-Firmware }
    "6" { Upload-All }
    default { Write-Host "Opcion invalida." -ForegroundColor Red }
}
