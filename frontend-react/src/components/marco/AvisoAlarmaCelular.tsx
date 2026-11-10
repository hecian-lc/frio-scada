import { Link } from 'react-router-dom'
import type { AlarmasActivas } from '../../lib/useAlarmasActivas'
import BotonVisto from '../BotonVisto'
import { CuadroAlarma, desdeTexto } from './BandaAlarmas'

// Celular: con una alarma activa sin ver, aviso arriba de todo (en el flujo, no tapa el contenido).
export default function AvisoAlarmaCelular({ alarmas: { sinVer, vistas, marcar } }: { alarmas: AlarmasActivas }) {
  const g = sinVer[0]
  if (!g) return null
  return (
    <div role="alert" className="flex shrink-0 items-center gap-2 border-2 border-estado-alta bg-panel p-2 md:hidden">
      <CuadroAlarma />
      <span className="min-w-0 flex-1 text-sm">
        <b className="block font-semibold text-estado-alta">{g.titulo}</b>
        <span className="text-texto-2">{[g.accion, desdeTexto(g.desde)].filter(Boolean).join(' · ')}</span>
      </span>
      {sinVer.length > 1 && <Link to="/alarmas" className="inline-flex min-h-[44px] shrink-0 items-center px-1 text-sm font-semibold text-accion">+{sinVer.length - 1} más</Link>}
      <BotonVisto claves={g.claves} vistas={vistas} marcar={marcar} className="min-h-[44px]" />
    </div>
  )
}
