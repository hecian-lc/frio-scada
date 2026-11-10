import { Panel } from './Panel'
import { useCamarasStore } from '../store/camaras'
import { estaVencido } from '../lib/estadoGrupo'
import { alarmasActivas } from '../lib/frases'
import { contarDescongelados } from '../lib/historial'
import { CAMARAS, GRUPOS, diaPlanta, nombreCamara, num, type FilaDescongelado } from '../lib/camaras'
import { useDatos } from '../lib/useDatos'
import { useNow } from '../lib/useNow'

const n = (v: number | null) => (v == null ? '—' : String(v))
const frac = (v: number | null, de: number) => (v == null ? '—' : `${v}/${de}`)

export default function ResumenHoy() {
  const estado = useCamarasStore(s => s.estado)
  const recibidoEn = useCamarasStore(s => s.recibidoEn)
  const incompatible = useCamarasStore(s => s.mapa === 'incompatible')
  const ahora = useNow(1000)
  const fresco = !!estado && !incompatible && !estaVencido(recibidoEn, ahora)
  // día de planta (no del navegador)
  const dia = diaPlanta(ahora)
  const { data, error } = useDatos<FilaDescongelado>('descongelados', dia, dia, '', 60000)
  const activas = fresco ? alarmasActivas(estado!) : null
  const filas = CAMARAS.map(c => ({
    c,
    d: error || !data ? null : contarDescongelados(data.filter(f => f.camara === c)).hechos,
    a: activas ? activas.filter(a => !a.c || a.c === c).length : null,
    k: fresco ? GRUPOS.filter(g => num(estado, `${c}.G${g}.comp`) === 1).length : null,
  }))
  const suma = (v: (number | null)[]) => (v.some(x => x == null) ? null : v.reduce<number>((t, x) => t + (x ?? 0), 0))
  return (
    <Panel titulo="Hoy" data-tour="hoy">
      <table className="w-full text-sm">
        <thead><tr className="text-left text-xs text-texto-2">
          <th className="px-2 py-1 font-medium">Cámara</th><th className="px-2 py-1 text-right font-medium">Descongelados</th><th className="px-2 py-1 text-right font-medium">Alarmas</th><th className="px-2 py-1 text-right font-medium">Compresores</th>
        </tr></thead>
        <tbody>
          {filas.map(f => (
            <tr key={f.c} className="border-t border-linea-fila">
              <td className="px-2 py-1.5">{nombreCamara(f.c)}</td>
              <td className="px-2 py-1.5 text-right font-mono">{n(f.d)}</td>
              <td className="px-2 py-1.5 text-right font-mono">{n(f.a)}</td>
              <td className="px-2 py-1.5 text-right font-mono">{frac(f.k, GRUPOS.length)}</td>
            </tr>
          ))}
          <tr className="border-t border-linea-fila bg-fila-total font-semibold">
            <td className="px-2 py-1.5">Total</td>
            <td className="px-2 py-1.5 text-right font-mono">{n(suma(filas.map(f => f.d)))}</td>
            <td className="px-2 py-1.5 text-right font-mono">{n(activas ? activas.length : null)}</td>
            <td className="px-2 py-1.5 text-right font-mono">{frac(suma(filas.map(f => f.k)), CAMARAS.length * GRUPOS.length)}</td>
          </tr>
        </tbody>
      </table>
    </Panel>
  )
}
