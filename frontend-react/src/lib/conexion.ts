import { estaVencido } from './estadoGrupo'

// El enlace con el PLC es inalámbrico y se corta unos segundos: el aviso recién aparece pasados 15 s.
export const AVISO_MS = 15000

export function estadoConexion(recibidoEn: number | null, ahora: number): { tipo: 'ok' | 'demora' | 'cortada' | 'nunca'; desde?: number; minutos?: number } {
  if (recibidoEn === null) return { tipo: 'nunca' }
  if (!estaVencido(recibidoEn, ahora)) return { tipo: 'ok' }
  if (!estaVencido(recibidoEn, ahora, AVISO_MS)) return { tipo: 'demora' }
  return { tipo: 'cortada', desde: recibidoEn, minutos: Math.floor((ahora - recibidoEn) / 60000) }
}

// Al abrir el portal todavía no llegó nada ('nunca'): se espera AVISO_MS desde que se montó el marco antes de avisar.
export const mostrarAviso = (tipo: ReturnType<typeof estadoConexion>['tipo'], montadoEn: number, ahora: number) =>
  tipo === 'cortada' || (tipo === 'nunca' && ahora - montadoEn > AVISO_MS)

export const textoAlarmas = (n: number) => n === 0 ? '' : n === 1 ? '1 alarma activa' : `${n} alarmas activas`
