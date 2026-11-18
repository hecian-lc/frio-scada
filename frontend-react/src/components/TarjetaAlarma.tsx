import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { Panel } from './Panel'
import BotonVisto from './BotonVisto'
import QueHacer from './QueHacer'
import ContactoGuardia from './ContactoGuardia'
import { useAlarmasActivas } from '../lib/useAlarmasActivas'
import { hhmm } from '../lib/camaras'

export default function TarjetaAlarma() {
  const { grupos, sinVer, vistas, marcar } = useAlarmasActivas()
  const g = sinVer[0] ?? grupos[0]
  if (!g) return (
    <Panel titulo="Alarmas"><div className="flex items-center gap-2 font-semibold text-ok-texto"><Check size={20} aria-hidden="true" />Sin alarmas activas</div></Panel>
  )
  const otras = (sinVer.length || grupos.length) - 1
  return (
    <section role="alert" className="rounded-lg border border-alta-borde bg-alta-suave p-[18px] shadow-tarjeta">
      <div className="flex items-center gap-2.5">
        <span aria-hidden="true" className="inline-grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[8px] bg-estado-alta text-base font-bold text-estado-alta-sobre">!</span>
        <div className="min-w-0 flex-1 text-sm">
          <b className="block font-semibold text-alta-texto">{g.titulo}</b>
          {g.desde !== undefined && <span className="text-texto-2">{g.desde === null ? 'desde antes de hoy' : `desde ${hhmm(g.desde)}`}</span>}
        </div>
        {otras > 0 && <Link to="/alarmas" className="toque inline-flex shrink-0 items-center text-sm font-semibold text-accion">+{otras} más</Link>}
      </div>
      <QueHacer clave={g.claves[0]} soloTexto className="mt-3 rounded-[8px] bg-panel p-2.5 text-sm" />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <BotonVisto claves={g.claves} vistas={vistas} marcar={marcar} texto={g.titulo} className="ml-0 min-h-[44px] rounded-md" />
        <ContactoGuardia compacto />
      </div>
    </section>
  )
}
