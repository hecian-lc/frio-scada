// Colores del HMI por estado de grupo: tokens de hmi/tokens.css (claro y oscuro)
type ColorEstado = { fondo: string; texto: string; borde?: string }
const APAGADO: ColorEstado = { fondo: 'var(--placa)', texto: 'var(--texto-2)', borde: 'var(--borde-campo)' }
const COLORES: Record<string, ColorEstado> = {
  'DESHABILITADO': APAGADO,
  'DETENIDO':      APAGADO,
  'FRIO':          { fondo: 'var(--eq-frio)', texto: 'var(--eq-sobre)' },
  'DESCONGELANDO': { fondo: 'var(--eq-desc)', texto: 'var(--eq-sobre)' },
  'ESCURRIENDO':   { fondo: 'var(--eq-escurre)', texto: 'var(--eq-sobre-claro)', borde: 'var(--eq-escurre-borde)' },
  'ALARMA RES':    { fondo: 'var(--estado-alta)', texto: 'var(--estado-alta-sobre)' },
  'MANUAL':        { fondo: 'var(--eq-manual)', texto: 'var(--eq-sobre)' },
}
export const COLOR_SIN_DATOS: ColorEstado = { fondo: 'var(--estado-invalido)', texto: 'var(--estado-alta-sobre)' }
const ALIAS: Record<string, string> = { 'DESHAB.': 'DESHABILITADO', 'DESCONG.': 'DESCONGELANDO', 'ESCURRE': 'ESCURRIENDO', 'ALARMA': 'ALARMA RES' }

export function colorEstadoGrupo(estado: string): ColorEstado {
  return COLORES[ALIAS[estado] ?? estado] ?? APAGADO
}

// Sin dato fresco: nunca llegó o pasó el umbral desde el último ok
export function estaVencido(ts: number | null, ahora: number, umbralMs = 5000): boolean {
  return ts === null || ahora - ts > umbralMs
}

// Un mensaje retenido puede ser viejo (llega al suscribirse): solo cuenta como fresco si su _ts está a <= 60 s del reloj local
export function recepcionFresca(retenido: boolean, tsPoller: number | undefined, ahora: number, toleranciaMs = 60000): boolean {
  return !retenido || (typeof tsPoller === 'number' && ahora - tsPoller <= toleranciaMs)
}
