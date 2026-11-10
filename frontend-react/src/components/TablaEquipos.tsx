import { useState } from 'react'
import { Panel } from './Panel'
import { Button } from './ui/button'
import SimboloEquipo from './SimboloEquipo'
import HojaEquipo from './HojaEquipo'
import { usePermiso } from './Confirmar'
import { estadoEquipo, faltanMin } from '../lib/frases'
import { GRUPOS, num, txt } from '../lib/camaras'
import { horasTxt } from '../lib/historial'
import type { Estado } from '../store/camaras'

const SALIDAS = [['comp', 'C', 'Compresor'], ['eva', 'E', 'Evaporador'], ['res', 'R', 'Resistencia']] as const

// Un renglón por equipo; desde md es tabla, abajo cada equipo ocupa dos renglones (sin scroll horizontal).
export default function TablaEquipos({ estado, cam, hayDatos }: { estado: Estado | null; cam: string; hayDatos: boolean }) {
  const permiso = usePermiso(1)
  const [hoja, setHoja] = useState<number | null>(null)
  const falta = hayDatos && estado ? faltanMin(estado, cam) : null
  const dato = (g: number, k: string, horas = false) => {
    const v = hayDatos ? txt(estado, `${cam}.G${g}.${k}`) : ''
    return v === '' || !Number.isFinite(Number(v)) ? '—' : horas ? horasTxt(Number(v)) : v
  }
  const fila = (g: number) => {
    const eq = hayDatos && estado ? estadoEquipo(estado, cam, g) : null
    const desc = eq?.clave === 'DESCONGELANDO'
    const estadoTxt = (eq ? eq.texto : 'Sin datos') + (desc && falta != null ? ` · faltan ${falta} min` : '')
    const punto = <SimboloEquipo c={cam} g={g} size={24} />
    const chips = (
      <span className="inline-flex gap-2">
        {SALIDAS.map(([k, l, n]) => {
          const on = hayDatos && num(estado, `${cam}.G${g}.${k}`) === 1
          const rell = k === 'res' && desc ? 'var(--eq-desc)' : 'var(--accion)'
          return <span key={k} title={`${n}: ${on ? 'prendido' : 'apagado'}`} aria-label={`${n}: ${on ? 'prendido' : 'apagado'}`} className="inline-flex items-center gap-0.5 text-xs font-medium">{l}
            <span aria-hidden className={`inline-block h-[10px] w-[10px] border ${on ? '' : 'border-borde-campo'}`} style={on ? { background: rell, borderColor: rell } : undefined} /></span>
        })}
      </span>
    )
    const boton = <Button variant="outline" className="shrink-0 px-3 max-md:min-h-[44px]" disabled={!permiso.ok} onClick={() => setHoja(g)}>Cambiar…</Button>
    return { estadoTxt, punto, chips, boton }
  }
  return (
    <Panel titulo="Equipos" className={hayDatos ? '' : 'opacity-70'}>
      <table className="hidden w-full text-left text-sm md:table">
        <thead><tr className="text-xs text-texto-2"><th className="pb-1 pr-2 font-medium">Eq.</th><th className="pb-1 pr-2 font-medium">Estado</th><th className="pb-1 pr-2 font-medium">Salidas</th><th className="pb-1 pr-2 font-medium">Arranques</th><th className="pb-1 pr-2 font-medium">Horas de marcha</th><th className="pb-1 pr-2 font-medium">Sin descongelar</th><th /></tr></thead>
        <tbody>{GRUPOS.map(g => { const r = fila(g); return (
          <tr key={g} className="border-t border-linea-fila">
            <td className="py-1 pr-2 font-medium">{g}</td>
            <td className="py-1 pr-2"><span className="flex items-center gap-1.5">{r.punto}{r.estadoTxt}</span></td>
            <td className="py-1 pr-2">{r.chips}</td>
            <td className="py-1 pr-2 font-mono">{dato(g, 'arranques')}</td>
            <td className="py-1 pr-2 font-mono">{dato(g, 'horas_marcha', true)}</td>
            <td className="py-1 pr-2 font-mono">{dato(g, 'horas_sin_desc', true)}</td>
            <td className="py-1 text-right">{r.boton}</td>
          </tr>) })}</tbody>
      </table>
      <div className="divide-y divide-linea-fila md:hidden">{GRUPOS.map(g => { const r = fila(g); return (
        <div key={g} className="space-y-1 py-2 text-sm">
          <div className="flex items-center gap-2">{r.punto}<span className="min-w-0 flex-1"><b>Equipo {g}</b> · {r.estadoTxt}</span>{r.boton}</div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-texto-2">{r.chips}<span><span className="font-mono">{dato(g, 'arranques')}</span> arranques</span><span><span className="font-mono">{dato(g, 'horas_marcha', true)}</span> marcha</span><span><span className="font-mono">{dato(g, 'horas_sin_desc', true)}</span> sin desc.</span></div>
        </div>) })}</div>
      {!permiso.ok && <div className="mt-2 text-xs text-texto-2">{permiso.motivo}</div>}
      {hoja != null && <HojaEquipo cam={cam} g={hoja} onCerrar={() => setHoja(null)} />}
    </Panel>
  )
}
