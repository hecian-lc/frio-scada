import { hhmm } from '../lib/camaras'
import type { AlarmaActivaVista } from '../lib/alarmas'
import { useVistas } from '../lib/vistas'
import BotonVisto from './BotonVisto'
import QueHacer from './QueHacer'
import { Check } from 'lucide-react'
import { Panel } from './Panel'
import MarcaAlarma from './MarcaAlarma'

type Vista = Omit<AlarmaActivaVista, 'desde'> & { desde?: number | null; claves?: string[] }

// alarmas = null: sin datos frescos del PLC
export default function PanelAlarmas({ alarmas }: { alarmas: Vista[] | null }) {
  const { vistas, marcar } = useVistas(!!alarmas?.length)
  if (!alarmas) return <Panel titulo="Alarmas de la cámara"><div className="text-sm text-texto-2">Sin datos del PLC</div></Panel>
  if (!alarmas.length) return <Panel titulo="Alarmas de la cámara"><div className="flex items-center gap-2 text-sm font-semibold text-ok-texto"><Check size={18} aria-hidden="true" />Sin alarmas activas</div></Panel>
  return (
    <Panel titulo="Alarmas de la cámara">
      <div role="alert" className="space-y-1.5 text-sm">
        {alarmas.map(a => (
          <div key={a.clave} className="flex flex-wrap items-center gap-x-2 gap-y-1"><MarcaAlarma /><b className="text-alta-texto">{a.titulo}</b>
            {a.desde !== undefined && <span className="font-mono text-xs text-texto-2">{a.desde === null ? 'desde antes de hoy' : `desde ${hhmm(a.desde)}`}</span>}
            <BotonVisto claves={a.claves ?? [a.clave]} vistas={vistas} marcar={marcar} texto={a.titulo} />
            <div className="basis-full"><QueHacer clave={a.claves?.[0] ?? a.clave} /></div></div>
        ))}
      </div>
    </Panel>
  )
}
