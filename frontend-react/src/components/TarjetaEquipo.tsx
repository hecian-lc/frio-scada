import { Icono } from './Icono'
import { Button } from './ui/button'
import { estadoEquipo, faltanMin } from '../lib/frases'
import { num, txt } from '../lib/camaras'
import { horasTxt } from '../lib/historial'
import { cn } from '../lib/utils'
import type { Estado } from '../store/camaras'

const SALIDAS = [['comp', 'Comp.', 'Compresor'], ['eva', 'Evap.', 'Evaporador'], ['res', 'Resist.', 'Resistencia']] as const

export default function TarjetaEquipo({ estado, cam, g, hayDatos, atenuado, permitido, onCambiar }: { estado: Estado | null; cam: string; g: number; hayDatos: boolean; atenuado: boolean; permitido: boolean; onCambiar: () => void }) {
  const eq = hayDatos && estado ? estadoEquipo(estado, cam, g) : null
  const falta = hayDatos && estado ? faltanMin(estado, cam) : null
  const desc = eq?.clave === 'DESCONGELANDO'
  const dato = (k: string) => {
    const v = hayDatos ? txt(estado, `${cam}.G${g}.${k}`) : ''
    return v === '' || !Number.isFinite(Number(v)) ? '—' : k.startsWith('horas') ? horasTxt(Number(v)) : v
  }
  return (
    <div className={cn('min-w-0 rounded-lg border border-linea bg-panel p-3.5 shadow-tarjeta', atenuado && 'opacity-[.55] grayscale-[.6]')}>
      <div className="flex items-center gap-2.5">
        {eq
          ? <span className="inline-grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full" style={{ background: eq.color, color: eq.sobre, border: eq.borde ? `1px solid ${eq.borde}` : undefined }}><Icono nombre={eq.icono} size={22} /></span>
          : <span className="h-[38px] w-[38px] shrink-0 animate-pulse rounded-full bg-fila-total" />}
        <div className="min-w-0 leading-tight">
          <div className="text-base font-bold">Equipo {g}</div>
          {eq ? <div className="text-sm font-semibold text-texto-2">{eq.texto}{desc && falta != null && ` · faltan ${falta} min`}</div> : <div className="mt-1 h-[16px] w-20 animate-pulse rounded-[6px] bg-fila-total" />}
        </div>
      </div>
      <div className="mt-3 flex gap-1.5">
        {SALIDAS.map(([k, l, n]) => {
          if (!hayDatos) return <span key={k} aria-label={`${n}: sin datos`} className="h-[24px] w-[52px] animate-pulse rounded-[6px] bg-fila-total" />
          const on = num(estado, `${cam}.G${g}.${k}`) === 1
          return <span key={k} aria-label={`${n}: ${on ? 'en marcha' : 'parado'}`} className={cn('inline-flex h-[24px] items-center rounded-[6px] px-2 text-xs font-semibold', on ? (k === 'res' && desc ? 'bg-eq-desc text-accion-texto' : 'bg-accion text-accion-texto') : 'bg-fila-total text-texto-2')}>{l}</span>
        })}
      </div>
      <dl className="mt-3 space-y-1 text-sm">
        {([['Horas de marcha', 'horas_marcha'], ['Arranques', 'arranques'], ['Sin descongelar', 'horas_sin_desc']] as const).map(([t, k]) => (
          <div key={k} className="flex items-baseline justify-between gap-2"><dt className="text-xs text-texto-2">{t}</dt>{hayDatos ? <dd className="font-mono font-semibold">{dato(k)}</dd> : <dd className="h-[18px] w-14 animate-pulse rounded-[10px] bg-fila-total" />}</div>
        ))}
      </dl>
      <Button variant="outline" className="mt-3 w-full max-md:min-h-[44px]" disabled={!permitido || !hayDatos || atenuado} title={!hayDatos || atenuado ? 'Sin conexión con el PLC' : undefined} onClick={onCambiar}>Cambiar modo</Button>
    </div>
  )
}
