/// <reference types="vite/client" />

declare const __APP_VERSION__: string

interface ImportMetaEnv {
  readonly VITE_DATA_MODE?: string
  readonly VITE_MQTT_URL?: string
  readonly VITE_API_BASE?: string
  readonly VITE_GRAFANA_HOST?: string
  readonly VITE_GRAFANA_DASHBOARD_UID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
