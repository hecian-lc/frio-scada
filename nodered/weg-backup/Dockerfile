# Contenedor de backup: cron semanal de InfluxDB + configuración, guardián de disco y copia a Google Drive / carpeta de red (rclone).
FROM alpine:3.20

ARG INFLUX_CLI_VERSION=2.7.5
# amd64 (PC) o arm64 (Raspberry Pi): lo pone buildx según la plataforma
ARG TARGETARCH=amd64
RUN apk add --no-cache bash curl tar coreutils findutils tzdata jq rclone \
    && curl -fsSL "https://dl.influxdata.com/influxdb/releases/influxdb2-client-${INFLUX_CLI_VERSION}-linux-${TARGETARCH}.tar.gz" -o /tmp/influx.tgz \
    && tar xzf /tmp/influx.tgz -C /tmp \
    && find /tmp -name influx -type f -exec mv {} /usr/local/bin/influx \; \
    && chmod +x /usr/local/bin/influx \
    && rm -rf /tmp/*

COPY backup.sh /usr/local/bin/backup.sh
COPY restore.sh /usr/local/bin/restore.sh
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
COPY watch.sh /usr/local/bin/watch.sh
RUN chmod +x /usr/local/bin/backup.sh /usr/local/bin/restore.sh /usr/local/bin/entrypoint.sh /usr/local/bin/watch.sh \
    && mkdir -p /backups \
    # Domingos 03:00; cada minuto, los pedidos del portal (copia ahora / probar destino)
    && printf '%s\n' "0 3 * * 0 /usr/local/bin/backup.sh >> /var/log/backup.log 2>&1" "* * * * * /usr/local/bin/watch.sh >> /var/log/backup.log 2>&1" > /etc/crontabs/root

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
