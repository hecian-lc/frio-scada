import { Link } from 'react-router-dom'
import { Panel } from './Panel'
import { Icono } from './Icono'
import { esRem, fraseEvento } from '../lib/frases'
import { quitarRemDuplicados, textoManiobra } from '../lib/historial'
import { hhmm, nombreCamara } from '../lib/camaras'
import type { Evento } from '../lib/alarmas'

// conCamara: en Inicio (las dos cámaras juntas) cada evento dice de qué cámara es
export default function EventosHoy({ eventos, error, max = 10, titulo = 'Eventos de hoy', conCamara = false }: { eventos: Evento[] | null; error: boolean; max?: number; titulo?: string; conCamara?: boolean }) {
  const ult = quitarRemDuplicados(eventos ?? []).slice(-max).reverse()
  return (
    <Panel titulo={titulo}>
      {error ? <div className="text-sm text-texto-2">No se pudieron cargar los eventos</div>
        : !eventos ? <div className="text-sm text-texto-2">Cargando…</div>
        : ult.length === 0 ? <div className="text-sm text-texto-2">Sin eventos hoy</div>
        : <ul className="space-y-1 text-sm">{ult.map((a, i) => <li key={`${a.ts}-${i}`}><span className="font-mono text-texto-2">{hhmm(a.ts)}</span> {(a.maniobra || esRem(a.texto)) && <span className="inline-block align-text-bottom" title="Maniobra desde el portal"><Icono nombre="manual" size={16} /></span>} {conCamara && !a.maniobra && /^C\d/i.test(a.texto) && <span className="text-texto-2">{nombreCamara(a.texto.slice(0, 2).toUpperCase())}: </span>}{a.maniobra ? textoManiobra(a) : fraseEvento(a.texto, a.estado)}</li>)}</ul>}
      <Link to="/eventos" className="toque mt-2 inline-flex items-center text-sm underline">Ver todos</Link>
    </Panel>
  )
}
