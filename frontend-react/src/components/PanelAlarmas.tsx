import { hhmm } from '../lib/camaras'
import type { AlarmaActivaVista } from '../lib/alarmas'
import { useVistas } from '../lib/vistas'
import BotonVisto from './BotonVisto'
import { Panel } from './Panel'
import MarcaAlarma from './MarcaAlarma'
import MarcaSinDatos from './MarcaSinDatos'

type Vista = Omit<AlarmaActivaVista, 'desde'> & { desde?: number | null; claves?: string[] }

// alarmas = null: sin datos frescos del PLC
export default function PanelAlarmas({ alarmas }: { alarmas: Vista[] | null }) {
  const { vistas, marcar } = useVistas(!!alarmas?.length)
  if (!alarmas) return <Panel titulo="Alarmas"><div className="flex items-center gap-2 text-sm text-estado-invalido"><MarcaSinDatos />Sin datos del PLC</div></Panel>
  if (!alarmas.length) return <Panel titulo="Alarmas"><div className="text-sm">Sin alarmas activas</div></Panel>
  return (
    <Panel titulo="Alarmas">
      <div role="alert" className="space-y-1.5 text-sm">
        {alarmas.map(a => (
          <div key={a.clave} className="flex flex-wrap items-center gap-x-2 gap-y-1"><MarcaAlarma /><b className="text-estado-alta">{a.titulo}</b>{a.accion && <span>{a.accion}</span>}
            {a.desde !== undefined && <span className="font-mono text-xs text-texto-2">{a.desde === null ? 'desde antes de hoy' : `desde ${hhmm(a.desde)}`}</span>}
            <BotonVisto claves={a.claves ?? [a.clave]} vistas={vistas} marcar={marcar} /></div>
        ))}
      </div>
    </Panel>
  )
}
