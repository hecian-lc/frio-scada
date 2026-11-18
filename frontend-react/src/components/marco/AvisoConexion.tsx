import { useState } from 'react'
import { WifiOff } from 'lucide-react'
import { hhmm } from '../../lib/camaras'
import { estadoConexion, mostrarAviso } from '../../lib/conexion'
import { useNow } from '../../lib/useNow'
import { useCamarasStore } from '../../store/camaras'

const hace = (m: number) => (m < 1 ? 'hace menos de un minuto' : m === 1 ? 'hace 1 minuto' : `hace ${m} minutos`)

// Sin datos del PLC por más de 15 s: aviso ámbar debajo del encabezado (las cámaras siguen con el tablero).
export default function AvisoConexion() {
  const [montadoEn] = useState(Date.now)
  const ahora = useNow(1000)
  const e = estadoConexion(useCamarasStore(s => s.recibidoEn), ahora)
  if (!mostrarAviso(e.tipo, montadoEn, ahora)) return null
  return (
    <div role="status" className="mx-3 mt-3 flex shrink-0 items-center gap-3 rounded-lg border border-aviso-borde bg-aviso-suave p-3 text-aviso-texto md:mx-8 md:mt-6 md:px-4">
      <span className="grid h-[40px] w-[40px] shrink-0 place-items-center rounded-full bg-panel"><WifiOff aria-hidden="true" className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1 text-sm">
        <b className="block text-base font-semibold">
          {e.tipo === 'cortada' ? `Sin conexión con el PLC desde las ${hhmm(e.desde!)} (${hace(e.minutos!)})` : 'Sin conexión con el PLC'}
        </b>
        {e.tipo === 'cortada' ? 'Lo que ves son los últimos datos recibidos. ' : 'Todavía no llegó ningún dato del PLC. '}Las cámaras siguen funcionando con el tablero. Revisá la red de la planta o avisá al técnico.
      </div>
      <span className="hidden shrink-0 text-sm sm:inline">Reintentando…</span>
    </div>
  )
}
