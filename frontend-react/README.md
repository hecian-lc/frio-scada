# Frío SCADA — Frontend

Portal React del monitoreo de cámaras de frío. Servido por nginx (puerto 9090)
detrás del reverse-proxy que expone `/api` (frio-api) y `/mqtt` (Mosquitto).

## Stack

React 18 · Vite · TypeScript · Tailwind · Zustand · shadcn/ui (Radix) · lucide

## Datos en vivo

El estado del PLC llega por **MQTT sobre WebSocket** (`/mqtt`): `frio/estado`
(retenido), `frio/latido`, `frio/eventos` y `frio/status` (`src/store/live.ts` y
`src/store/camaras.ts`). La REST (`/api`) se usa para login, configuración,
historial (eventos, descongelados, tramos), mandos a distancia y reportes.

## Estructura

```
src/
├── views/        Inicio (General), Camara, Historial, Reportes, Avisos, Mas, Sistema, Config, Usuarios, Login…
├── components/   Tarjetas, paneles, marco (encabezado, menú, barra de estado) y ui/ (shadcn)
├── hmi/          Tokens de color y tipografía (estilo C, claro y oscuro)
├── store/        Zustand: auth, camaras, live (MQTT), config, branding, server
├── lib/          Lógica pura con tests (Vitest): resumen, conexión, frases, historial, tutorial…
└── types.ts      Tipos compartidos de la configuración
```

## Comandos

```bash
npm install
npm run dev      # servidor de desarrollo
npm test         # tests de lib/ (Vitest)
npm run build    # tsc -b && vite build -> dist/ (lo sirve nginx)
```

El build (`dist/`) se monta en el contenedor nginx del stack (ver
`../nodered/docker-compose.yml`).
