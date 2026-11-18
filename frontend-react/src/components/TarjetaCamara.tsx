import { Link } from 'react-router-dom'
import { Icono } from './Icono'
import { Panel } from './Panel'
import { Pastilla } from './ui/pastilla'
import { useCamarasStore } from '../store/camaras'
import { estadoConexion } from '../lib/conexion'
import { alarmasActivas, estadoEquipo } from '../lib/frases'
import { porCamara } from '../lib/resumen'
import { GRUPOS, diaPlanta, hhmm, nombreCamara, txt, type FilaDescongelado } from '../lib/camaras'
import { useDatos } from '../lib/useDatos'
import { useNow } from '../lib/useNow'
import { cn } from '../lib/utils'

const MODOS: Record<string, string> = { AUTOMATICO: 'Automático', MANUAL: 'Manual', STOP: 'Detenido' }

export default function TarjetaCamara({ cam }: { cam: string }) {
  const estado = useCamarasStore(s => s.estado)
  const recibidoEn = useCamarasStore(s => s.recibidoEn)
  const ts = useCamarasStore(s => s.ts)
  const ahora = useNow(1000)
  const dia = diaPlanta(ahora)
  const { data, error } = useDatos<FilaDescongelado>('descongelados', dia, dia, '', 60000)
  const tipo = estadoConexion(recibidoEn, ahora).tipo
  const cargando = tipo === 'nunca' || !estado
  const atenuado = tipo === 'demora' || tipo === 'cortada'
  const modo = estado ? MODOS[txt(estado, `${cam}.modo`)] : undefined
  const nAl = estado ? alarmasActivas(estado, cam).length : 0
  const p = estado ? porCamara(estado, cam, error ? null : data, ahora) : null
  return (
    <Panel titulo={nombreCamara(cam)} className="min-w-0"
      accion={<>
        {atenuado && ts && <Pastilla tono="neutro">Último dato {hhmm(ts)}</Pastilla>}
        {modo && <Pastilla tono="neutro">{modo}</Pastilla>}
        {nAl > 0 && <Pastilla tono="alta">{nAl} {nAl === 1 ? 'alarma' : 'alarmas'}</Pastilla>}
        <Link to={`/camara/${cam}`} className="toque ml-1 inline-flex items-center text-sm font-semibold text-accion">Ver cámara</Link>
      </>}>
      <div className={cn('grid grid-cols-2 gap-2 sm:grid-cols-4', atenuado && 'opacity-[.55] grayscale-[.6]')}>
        {GRUPOS.map(g => {
          if (cargando) return <div key={g} className="h-[52px] animate-pulse rounded-[10px] bg-fila-total" />
          const eq = estadoEquipo(estado!, cam, g)
          return (
            <div key={g} className="flex items-center gap-2 rounded-[10px] bg-fila-total p-2">
              <span className="inline-grid h-8 w-8 shrink-0 place-items-center rounded-full" style={{ background: eq.color, color: eq.sobre, border: eq.borde ? `1px solid ${eq.borde}` : undefined }}><Icono nombre={eq.icono} size={18} /></span>
              <div className="min-w-0 text-sm leading-tight"><div className="truncate font-semibold">Equipo {g}</div><div className="truncate text-texto-2">{eq.texto}</div></div>
            </div>
          )
        })}
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-linea-fila pt-3 text-sm">
        {([['Compresores', p?.compresores], ['Descongelados', p?.hechos], ['Próximo', p?.proximo]] as const).map(([t, v]) => (
          <div key={t} className="min-w-0"><dt className="text-xs text-texto-2">{t}</dt>
            {cargando || !v ? <dd className="mt-0.5 h-[18px] animate-pulse rounded-[10px] bg-fila-total" /> : <dd className="truncate font-mono font-semibold">{v}</dd>}</div>
        ))}
      </dl>
    </Panel>
  )
}
