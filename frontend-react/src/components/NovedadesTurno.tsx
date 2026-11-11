import { useEffect, useState } from 'react'
import { apiJson } from '../lib/api'
import { hhmm } from '../lib/camaras'
import { vistasStore } from '../lib/vistas'
import { Panel } from './Panel'

interface Novedad { ts: number; usuario: string; texto: string; nota: string; camara: string | null }

const firma = (v: Map<string, { ts: number }>) => [...v].map(([c, x]) => c + x.ts).join()

// Notas que dejó la gente al marcar alarmas como vistas (últimas 12 h; la nota es texto, nunca HTML)
export default function NovedadesTurno() {
  const [lista, setLista] = useState<Novedad[]>([])
  useEffect(() => {
    const cargar = () => apiJson<Novedad[]>('/avisos/novedades').then(d => setLista(Array.isArray(d) ? d : [])).catch(() => { /* sin API: queda la última lista */ })
    cargar()
    const sondeo = setInterval(cargar, 60000)
    // El sondeo de vistas pone un Map nuevo cada 15 s: recargar solo si cambió alguna marca
    const baja = vistasStore.subscribe((s, antes) => { if (firma(s.vistas) !== firma(antes.vistas)) cargar() })
    return () => { clearInterval(sondeo); baja() }
  }, [])
  return (
    <Panel titulo="Novedades del turno">
      {!lista.length ? <div className="text-sm text-texto-2">Sin notas en las últimas 12 horas</div> : (
        <ul className="divide-y divide-linea text-sm">
          {lista.map(n => (
            <li key={`${n.ts}-${n.usuario}`} className="py-1">
              <div className="flex flex-wrap gap-x-2"><span className="font-mono text-texto-2">{hhmm(n.ts)}</span><b className="font-semibold">{n.usuario}</b><span>{n.texto}</span></div>
              <div className="break-words text-texto">{n.nota}</div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
