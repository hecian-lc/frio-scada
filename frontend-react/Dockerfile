# Frontend SCADA: build de Vite (modo live, ver .env.production) servido por nginx.
# La config de nginx (proxy /api y /mqtt) la monta docker-compose desde
# nodered/nginx/frontend.conf.
# El build de Vite no depende de la arquitectura: corre nativo y el dist se copia a la imagen de cada plataforma
FROM --platform=$BUILDPLATFORM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund --loglevel=error
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
