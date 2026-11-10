import { useNavigate } from 'react-router-dom'
import SimboloEquipo from './SimboloEquipo'
import { Icono } from './Icono'
import { Panel } from './Panel'
import { useCamarasStore } from '../store/camaras'
import { estaVencido } from '../lib/estadoGrupo'
import { alarmasActivas, estadoEquipo, fraseCamara, proximoTexto } from '../lib/frases'
import { CAMARAS, GRUPOS, nombreCamara, hhmm } from '../lib/camaras'
import { useNow } from '../lib/useNow'

const LEYENDA = ['FRIO', 'DESCONGELANDO', 'ESCURRIENDO', 'MANUAL', 'DETENIDO', 'ALARMA RES', 'sin-datos'].map(k => estadoEquipo({ 'L.G1.estado': k }, 'L', 1))

function Fila({ cam }: { cam: string }) {
  const nav = useNavigate()
  const estado = useCamarasStore(s => s.estado)
  const ts = useCamarasStore(s => s.ts)
  const recibidoEn = useCamarasStore(s => s.recibidoEn)
  const incompatible = useCamarasStore(s => s.mapa === 'incompatible')
  const ahora = useNow(1000)
  const vigente = !!estado && !estaVencido(recibidoEn, ahora) && !incompatible
  const f = vigente ? fraseCamara(estado!, cam, ahora) : null
  const hayDatos = !!f && f.nivel !== 'sin-datos'
  const nAl = vigente ? alarmasActivas(estado!).filter(a => !a.c || a.c === cam).length : 0
  const alarma = hayDatos && (f!.nivel === 'alarma' || nAl > 0)
  const titulo = hayDatos ? f!.titulo : incompatible ? 'El PLC tiene un programa viejo' : ts ? `Sin datos desde ${hhmm(ts)}` : 'Sin datos todavía'
  const ir = () => nav(`/camara/${cam}`)
  return (
    <tr role="link" tabIndex={0} onClick={ir} onKeyDown={e => { if (e.key === 'Enter') ir() }}
      className="cursor-pointer border-t border-linea-fila hover:bg-fila-total focus-visible:outline focus-visible:outline-2 max-sm:block max-sm:space-y-1 max-sm:p-2">
      <td className="px-2 py-1.5 font-semibold max-sm:block max-sm:p-0">
        <span className={alarma ? 'inline-flex items-center gap-1.5 text-estado-alta' : ''}>
          {alarma && <span className="inline-flex h-[16px] w-[16px] items-center justify-center bg-estado-alta text-estado-alta-sobre"><Icono nombre="alarma" size={12} /></span>}
          {nombreCamara(cam)}
        </span>
      </td>
      <td className="px-2 py-1.5 max-sm:block max-sm:p-0">
        <div className="grid grid-cols-4 justify-items-start gap-x-2 gap-y-1.5 sm:flex">
          {GRUPOS.map(g => <SimboloEquipo key={g} c={cam} g={g} size={24} />)}
        </div>
      </td>
      <td className={`px-2 py-1.5 max-sm:block max-sm:p-0 ${hayDatos ? (alarma ? 'text-estado-alta' : '') : 'text-estado-invalido'}`}>{titulo}</td>
      <td className="px-2 py-1.5 text-texto-2 max-sm:block max-sm:p-0">{hayDatos ? `Próximo: ${proximoTexto(estado!, cam, ahora)}` : '—'}</td>
      <td className={`px-2 py-1.5 font-mono max-sm:block max-sm:p-0 ${nAl > 0 ? 'text-estado-alta' : ''}`}>{vigente ? `${nAl} ${nAl === 1 ? 'alarma' : 'alarmas'}` : '—'}</td>
    </tr>
  )
}

export default function TablaCamaras() {
  return (
    <Panel titulo="Cámaras" data-tour="camaras">
      <table className="w-full text-left text-sm max-sm:block">
        <thead className="max-sm:hidden"><tr className="text-xs text-texto-2">
          <th className="px-2 py-1 font-medium">Cámara</th><th className="px-2 py-1 font-medium">Equipos</th><th className="px-2 py-1 font-medium">Estado</th><th className="px-2 py-1 font-medium">Próximo descongelado</th><th className="px-2 py-1 font-medium">Alarmas</th>
        </tr></thead>
        <tbody className="max-sm:block">{CAMARAS.map(c => <Fila key={c} cam={c} />)}</tbody>
      </table>
      <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-texto-2">
        {LEYENDA.map(l => (
          <li key={l.texto + l.icono} className="flex items-center gap-1">
            <span className="inline-flex h-[16px] w-[16px] items-center justify-center rounded-sm" style={{ background: l.color, color: l.sobre, border: l.borde ? `1px solid ${l.borde}` : undefined }}><Icono nombre={l.icono} size={11} /></span>{l.texto}
          </li>
        ))}
      </ul>
    </Panel>
  )
}
