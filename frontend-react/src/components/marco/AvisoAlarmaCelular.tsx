import { Link } from 'react-router-dom'
import { hhmm } from '../../lib/camaras'
import type { AlarmasActivas } from '../../lib/useAlarmasActivas'
import BotonVisto from '../BotonVisto'
import ContactoGuardia from '../ContactoGuardia'
import QueHacer from '../QueHacer'

const desdeTexto = (d: number | null | undefined) => (d === undefined ? '' : d === null ? 'desde antes de hoy' : `desde ${hhmm(d)}`)

// Cuadrado rojo "!" de alarma activa
const CuadroAlarma = () => <span aria-hidden="true" className="inline-grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[8px] bg-estado-alta text-base font-bold text-estado-alta-sobre">!</span>

// Celular: con una alarma activa sin ver, tarjeta arriba de todo (en el flujo, no tapa el contenido).
export default function AvisoAlarmaCelular({ alarmas: { sinVer, vistas, marcar } }: { alarmas: AlarmasActivas }) {
  const g = sinVer[0]
  if (!g) return null
  return (
    <div role="alert" className="mx-3 mt-3 grid shrink-0 gap-2.5 rounded-lg border border-alta-borde bg-panel p-3 shadow-tarjeta md:hidden">
      <div className="flex items-center gap-2.5">
        <CuadroAlarma />
        <div className="min-w-0 flex-1 text-sm">
          <b className="block font-semibold text-alta-texto">{g.titulo}</b>
          {g.desde !== undefined && <span className="text-texto-2">{desdeTexto(g.desde)}</span>}
        </div>
        {sinVer.length > 1 && <Link to="/alarmas" className="inline-flex min-h-[44px] shrink-0 items-center px-1 text-sm font-semibold text-accion">+{sinVer.length - 1} más</Link>}
      </div>
      <QueHacer clave={g.claves[0]} soloTexto className="rounded-[8px] bg-fila-total p-2.5 text-sm" />
      <div className="flex flex-wrap items-center gap-2">
        <BotonVisto claves={g.claves} vistas={vistas} marcar={marcar} texto={g.titulo} className="ml-0 min-h-[44px] rounded-md" />
        <ContactoGuardia compacto />
      </div>
    </div>
  )
}
