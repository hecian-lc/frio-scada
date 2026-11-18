import { useMemo } from 'react'
import { useCamarasStore } from '../store/camaras'
import { agruparActivas, alarmasActivasVista, ultimoPorClave, type Evento, type GrupoActivo } from './alarmas'
import { estaVencido } from './estadoGrupo'
import { AVISO_MS } from './conexion'
import { diaPlanta } from './camaras'
import { useDatos } from './useDatos'
import { useNow } from './useNow'
import { useVistas, vistoDe } from './vistas'

// Alarmas activas de toda la planta, agrupadas como en la página de cada cámara (sin filtro de cámara).
// sinDatos: el PLC no manda datos hace más de AVISO_MS (como el aviso de conexión, para no parpadear en cada corte
// corto del enlace inalámbrico); entonces no se sabe qué alarmas hay y grupos queda vacío.
export function useAlarmasActivas() {
  const estado = useCamarasStore(s => s.estado)
  const recibidoEn = useCamarasStore(s => s.recibidoEn)
  const incompatible = useCamarasStore(s => s.mapa === 'incompatible')
  const ahora = useNow(5000)
  const dia = diaPlanta(ahora)
  const ev = useDatos<Evento>('eventos', dia, dia, '', 60000)
  const ultimos = useMemo(() => ultimoPorClave(ev.data ?? []), [ev.data])
  const sinDatos = !estado || incompatible || estaVencido(recibidoEn, ahora, AVISO_MS)
  // Sin eventos cargados no se sabe desde cuándo: desde = undefined
  const grupos: GrupoActivo[] = sinDatos ? [] : agruparActivas(alarmasActivasVista(estado!, ultimos).map(a => ev.data && !ev.error && !ev.cargando ? a : { ...a, desde: undefined }))
  const { vistas, marcar } = useVistas(grupos.length > 0)
  const sinVer = grupos.filter(g => !vistoDe(vistas, g.claves))
  return { grupos, sinVer, sinDatos, vistas, marcar }
}
export type AlarmasActivas = ReturnType<typeof useAlarmasActivas>
