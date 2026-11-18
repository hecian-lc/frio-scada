FROM node:20-alpine
# CLI de Tailscale (misma versión que el tailscaled de las VMs): solo cliente,
# habla con el daemon del sistema por el socket montado.
ARG TS_VERSION=1.102.4
# sha256 del tgz oficial por arquitectura (coinciden con los .sha256 publicados por Tailscale).
# Al subir TS_VERSION hay que actualizarlos: si no coincide, el build falla.
ARG TS_SHA256_amd64=50748df1045e60b5b695f19f4c56b0da36c019948b440fb456b6584a50f0d8b9
ARG TS_SHA256_arm64=9dd1e6a592a014bbaea0103167ffe299adeda4ba14e078ce9c2895364f6c4c3f
# amd64 (PC) o arm64 (Raspberry Pi): lo pone buildx según la plataforma
ARG TARGETARCH=amd64
RUN case "$TARGETARCH" in amd64) sum="$TS_SHA256_amd64";; arm64) sum="$TS_SHA256_arm64";; *) echo "arquitectura no soportada: $TARGETARCH" >&2; exit 1;; esac \
  && wget -qO /tmp/ts.tgz https://pkgs.tailscale.com/stable/tailscale_${TS_VERSION}_${TARGETARCH}.tgz \
  && echo "${sum}  /tmp/ts.tgz" | sha256sum -c - \
  && tar xzf /tmp/ts.tgz -C /tmp \
  && mv /tmp/tailscale_${TS_VERSION}_${TARGETARCH}/tailscale /usr/local/bin/tailscale \
  && rm -rf /tmp/ts.tgz /tmp/tailscale_*
WORKDIR /app
COPY package.json ./
COPY src/ ./src/
# Corre como root a propósito: operar tailscaled (login/logout) exige root o
# "operator". Mitigación: sin puertos publicados, AGENT_TOKEN, tres operaciones fijas.
EXPOSE 3400
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget --spider -q http://127.0.0.1:3400/health || exit 1
CMD ["node", "src/index.js"]
