import { Link } from 'react-router-dom'
import { hhmm } from '../../lib/camaras'
import type { AlarmasActivas } from '../../lib/useAlarmasActivas'
import BotonVisto from '../BotonVisto'

// Cuadrado rojo "!" de alarma activa
export const CuadroAlarma = () => <span aria-hidden="true" className="inline-grid h-[20px] w-[20px] shrink-0 place-items-center bg-estado-alta text-xs font-bold text-estado-alta-sobre">!</span>

export const desdeTexto = (d: number | null | undefined) => (d === undefined ? '' : d === null ? 'desde antes de hoy' : `desde ${hhmm(d)}`)

// Banda fija de 32 px (computadora): la alarma activa más importante (la primera sin ver) y "+N más" a A1.
export default function BandaAlarmas({ alarmas: { grupos, sinVer, sinDatos, vistas, marcar } }: { alarmas: AlarmasActivas }) {
  const g = sinVer[0] ?? grupos[0]
  return (
    <div role="status" className={`hidden items-center gap-3 md:flex overflow-hidden border-t-2 bg-panel px-3 text-base ${g ? 'border-estado-alta' : 'border-linea'}`}>
      {!g ? <span className="text-texto-2">{sinDatos ? 'Alarmas: sin datos del PLC' : 'Sin alarmas activas'}</span> : <>
        <CuadroAlarma />
        <span className="min-w-0 truncate">
          <b className="font-semibold text-estado-alta">{g.titulo}</b>
          {g.accion && <span className="text-texto-2"> · {g.accion}</span>}
          {g.desde !== undefined && <span className="text-texto-2"> · {desdeTexto(g.desde)}</span>}
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-2">
          <BotonVisto claves={g.claves} vistas={vistas} marcar={marcar} className="md:min-h-0 md:h-[24px]" />
          {grupos.length > 1 && <Link to="/alarmas" className="text-sm font-semibold text-accion underline-offset-2 hover:underline">+{grupos.length - 1} más</Link>}
        </span>
      </>}
    </div>
  )
}
