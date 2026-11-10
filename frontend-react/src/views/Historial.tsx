import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Filtros, SinDatos, type Rango } from '../components/Filtros'
import { useDatos, hoy } from '../lib/useDatos'
import { useCamarasStore } from '../store/camaras'
import { useNow } from '../lib/useNow'
import { estaVencido, colorEstadoGrupo } from '../lib/estadoGrupo'
import { nombreCamara, fechaHora, type FilaDescongelado } from '../lib/camaras'
import { badgeDescongelado, esRem, UMBRAL_ARRANQUES_HORA, type TipoAviso } from '../lib/frases'
import { agruparActivas, agruparPeriodos, alarmasActivasVista, periodosAlarma, ultimoPorClave } from '../lib/alarmas'
import { equiposPorCamara, equiposDistintos, duracionTxt, equipoDe, horasTxt, prepararAvisos, filasEventos, type EquipoHist, filasAlarmas, filasCompresores, filasDescongelados } from '../lib/historial'
import { downloadXlsx } from '../lib/xlsx'
import { cn } from '../lib/utils'
import { Icono } from '../components/Icono'
import { Panel } from '../components/Panel'
import MarcaAlarma from '../components/MarcaAlarma'
import MarcaSinDatos from '../components/MarcaSinDatos'
import { COLOR_TRAMO } from '../lib/paginaCamara'
import BotonVisto from '../components/BotonVisto'
import { useVistas } from '../lib/vistas'

const PESTANAS = [
  { id: 'descongelados', label: 'Descongelados' },
  { id: 'compresores', label: 'Equipos' },
]
const PESTANAS_FIJAS = [{ id: 'alarmas', label: 'Alarmas' }, { id: 'eventos', label: 'Eventos' }]
const TITULO: Record<string, string> = { descongelados: 'Descongelados', compresores: 'Equipos', alarmas: 'Alarmas del período', eventos: 'Eventos' }
const pestanaCls = (on: boolean) => cn('toque inline-flex items-center border px-4 text-sm font-medium whitespace-nowrap', on ? 'border-accion bg-accion text-accion-texto' : 'border-borde-campo bg-placa')
const C = (k: string) => colorEstadoGrupo(k).fondo
// completo: sin color (lo normal no se marca); cortado o saltado: color de descongelando
const COLOR_BADGE: Record<string, string | undefined> = { completo: undefined, 'cortado a mano': C('DESCONGELANDO'), saltado: C('DESCONGELANDO') }
// alarma: cuadrado "!"; atención y resuelto: solo texto
const COLOR_AVISO: Partial<Record<TipoAviso, string>> = { cortado: C('DESCONGELANDO'), operario: C('FRIO'), info: C('DETENIDO') }

// Estado de un descongelado: texto con su marca (nunca texto blanco sobre color)
function Etiqueta({ etiqueta }: { etiqueta: string }) {
  const color = COLOR_BADGE[etiqueta]
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs">
      {etiqueta === 'no se hizo' ? <MarcaAlarma size={14} /> : etiqueta === 'sin datos' ? <MarcaSinDatos size={14} /> : color ? <span className="h-2.5 w-2.5" style={{ background: color }} /> : null}
      {etiqueta}
    </span>
  )
}

const Fila = ({ children }: { children: React.ReactNode }) => <li className="flex items-start gap-3 border-b border-linea-fila px-2 py-2 last:border-0">{children}</li>
// fechaHora = "dd/mm/aaaa, HH:MM:SS"
const dia = (ms: number) => fechaHora(ms).split(', ')[0]
const hm = (ms: number) => (fechaHora(ms).split(', ')[1] ?? '').slice(0, 5)

const pctTxt = (p: number | null) => p == null ? '' : ` (${Math.round(p * 100)} %)`
// Más tiempo en marcha = más color de "enfriando"
const colorPct = (p: number | null) => p == null ? COLOR_TRAMO['sin-datos'] : `color-mix(in srgb, ${COLOR_TRAMO.frio} ${Math.round(12 + 88 * p)}%, var(--placa))`
const diaCorto = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`

// Un bloque por cámara: cada equipo con un cuadradito por día (color = % del tiempo en marcha) y sus totales.
function BloqueEquipos({ camara, equipos }: { camara: string; equipos: EquipoHist[] }) {
  const dias = equipos[0]?.dias ?? []
  const distintos = new Map(equiposDistintos(equipos, dias.length).map(d => [d.grupo, d.motivo]))
  return (
    <section className="space-y-1.5 border-b border-linea-fila px-2 py-2 last:border-0">
      <h3 className="text-sm font-semibold">{nombreCamara(camara)}</h3>
      {dias.length > 1 && <div className="grid grid-cols-[4.5rem_1fr] sm:grid-cols-[4.5rem_1fr_19rem] gap-x-3 text-xs text-texto-2">
        <span /><div className="flex gap-0.5">{dias.map(d => <span key={d.dia} className="flex-1 text-center truncate">{diaCorto(d.dia)}</span>)}</div>
      </div>}
      {equipos.map(e => (
        <div key={e.grupo} className="grid grid-cols-[4.5rem_1fr] sm:grid-cols-[4.5rem_1fr_19rem] gap-x-3 gap-y-0.5 items-center">
          <span className="text-sm font-medium">{equipoDe(e.grupo)}</span>
          {e.dias.length === 1 ? ( // un solo día: barra llena según el % en marcha
            <div className="h-6 bg-linea-fila" title={`${horasTxt(e.dias[0].horas)} en marcha${pctTxt(e.dias[0].pct)} · ${e.dias[0].arranques} arranques`}>
              <div className="h-6 bg-eq-frio" style={{ width: `${(e.dias[0].pct ?? 0) * 100}%` }} />
            </div>
          ) : <div className="flex gap-0.5">
            {e.dias.map(d => <span key={d.dia} className="h-6 flex-1" style={{ background: colorPct(d.pct) }}
              title={`${diaCorto(d.dia)}: ${horasTxt(d.horas)} en marcha${pctTxt(d.pct)} · ${d.arranques} arranques`} />)}
          </div>}
          <span className="col-start-2 sm:col-start-auto text-xs text-texto-2">
            <b className="font-mono font-medium text-texto">{horasTxt(e.horas)}</b>{pctTxt(e.pct)} · {e.arranques} arranques · {e.descongelados} descongelados
          </span>
          {distintos.has(e.grupo) && <span className="col-start-2 sm:col-span-2 text-xs font-medium">Trabaja distinto al resto: {distintos.get(e.grupo)}. Conviene revisarlo.</span>}
          {e.maxArranquesHora > UMBRAL_ARRANQUES_HORA && <span className="col-start-2 sm:col-span-2 text-xs font-medium">Arranca demasiado seguido (hasta {e.maxArranquesHora} veces por hora): conviene revisarlo</span>}
          {e.horasSinDatos > 0 && <span className="col-start-2 sm:col-span-2 text-xs text-texto-2">{horasTxt(e.horasSinDatos)} sin datos</span>}
        </div>
      ))}
    </section>
  )
}

// fija: Alarmas y Eventos tienen su propia entrada en el menú; Historial queda con Descongelados y Equipos
export default function Historial({ fija }: { fija?: 'alarmas' | 'eventos' }) {
  const { pestana: param = 'descongelados' } = useParams()
  const pestana = fija ?? param
  const [r, setR] = useState<Rango>({ desde: hoy(), hasta: hoy(), camara: '' })
  const estado = useCamarasStore(s => s.estado)
  const recibidoEn = useCamarasStore(s => s.recibidoEn)
  const incompatible = useCamarasStore(s => s.mapa === 'incompatible')
  const fresco = !estaVencido(recibidoEn, useNow(5000)) && !incompatible
  const ruta = pestana === 'alarmas' ? 'eventos' : pestana
  const { data, error, cargando } = useDatos<any>(ruta, r.desde, r.hasta, r.camara)
  const desc = useDatos<FilaDescongelado>(pestana === 'compresores' ? 'descongelados' : '', r.desde, r.hasta, r.camara)
  const porCamara = useMemo(() => (pestana === 'compresores' ? equiposPorCamara(data ?? [], desc.data ?? []) : []), [pestana, data, desc.data])
  const comp = porCamara.flatMap(c => c.equipos)
  const avisos = useMemo(() => (pestana === 'eventos' ? prepararAvisos(data ?? [], estado, fresco) : []), [pestana, data, estado, fresco])
  const periodos = useMemo(() => (pestana === 'alarmas' ? periodosAlarma(data ?? []) : []), [pestana, data])
  const ultimos = useMemo(() => (pestana === 'alarmas' ? ultimoPorClave(data ?? []) : new Map()), [pestana, data])
  const cargado = !!data && !error && !cargando
  const finHoy = r.hasta === hoy() // "desde" y "sigue activa" solo valen si el rango llega a hoy
  const activas = pestana === 'alarmas' && fresco && estado ? alarmasActivasVista(estado, ultimos) : []
  const siguen = (clave: string) => finHoy && activas.some(a => a.clave === clave)
  const grupos = agruparActivas(activas)
  const { vistas, marcar } = useVistas(grupos.length > 0)
  // las abiertas que siguen activas ya están en el recuadro rojo
  const otras = agruparPeriodos(periodos.filter(p => !(p.fin === null && siguen(p.clave))))
  if (!fija && !PESTANAS.some(p => p.id === pestana)) return <Navigate to="/historial/descongelados" replace />
  const lista: any[] = data ?? []
  const filas = pestana === 'descongelados' ? filasDescongelados(lista as FilaDescongelado[])
    : pestana === 'eventos' ? filasEventos(avisos) : pestana === 'alarmas' ? filasAlarmas(periodos, siguen) : filasCompresores(comp)

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">{fija === 'alarmas' ? 'Alarmas' : fija === 'eventos' ? 'Eventos' : 'Historial'}</h1>
      {!fija && <div className="flex gap-2 overflow-x-auto">
        {PESTANAS.map(p => <Link key={p.id} to={`/historial/${p.id}`} className={pestanaCls(p.id === pestana)}>{p.label}</Link>)}
      </div>}
      {fija && <div className="flex gap-2 md:hidden">
        {PESTANAS_FIJAS.map(p => <Link key={p.id} to={`/${p.id}`} className={pestanaCls(p.id === fija)}>{p.label}</Link>)}
      </div>}
      <Filtros r={r} set={setR} />
      {pestana === 'alarmas' && (!fresco || !estado
        ? <div className="flex items-center gap-2 border border-linea bg-panel px-2 py-2 text-sm text-estado-invalido"><MarcaSinDatos />Sin datos del PLC</div>
        : activas.length === 0
          ? <div className="border border-linea bg-panel px-2 py-2 text-sm">Sin alarmas activas</div>
          : <ul role="alert" className="space-y-1 border-2 border-estado-alta bg-panel px-2 py-2">
              {grupos.map(a => <li key={a.clave} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <MarcaAlarma /><b className="text-estado-alta">{a.titulo}</b>
                {a.accion && <span>{a.accion}</span>}
                {cargado && finHoy && (!r.camara || a.camara === r.camara) && <span className="font-mono text-xs text-texto-2">{a.desde ? `desde ${dia(a.desde).slice(0, 5)} ${hm(a.desde)}` : 'desde antes de este período'}</span>}
                <BotonVisto claves={a.claves} vistas={vistas} marcar={marcar} />
              </li>)}
            </ul>)}
      <Panel titulo={TITULO[pestana] ?? 'Historial'}>
        {cargando && !data ? <div className="py-8 text-center text-sm text-texto-2">Cargando…</div> : <>
          <SinDatos error={error} vacio={!!data && lista.length === 0} />
          {pestana === 'alarmas' && cargado && lista.length > 0 && otras.length === 0 && <div className="px-2 py-2 text-xs text-texto-2">No hubo otras alarmas en el período</div>}
          <ul>
            {pestana === 'descongelados' && (lista as FilaDescongelado[]).map((f, i) => {
              const b = badgeDescongelado(f)
              return <Fila key={i}>
                <div className="w-12 shrink-0 font-mono text-sm font-medium">{f.inicio ? hm(f.inicio) : '—'}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm">{nombreCamara(f.camara)} · {f.grupos ? `equipos ${f.grupos.replace(/G/g, '')}` : 'sin equipos'}</div>
                  <div className="text-xs text-texto-2">{f.inicio ? `${dia(f.inicio)} · ` : ''}{b.motivo}</div>
                </div>
                <Etiqueta etiqueta={b.etiqueta} />
              </Fila>
            })}
            {pestana === 'alarmas' && otras.map((p, i) => (
              <Fila key={i}>
                <div className="min-w-0 flex-1 text-sm">{p.texto}
                  <div className="font-mono text-xs text-texto-2">{p.inicio === null ? 'antes del período' : `${dia(p.inicio).slice(0, 5)} ${hm(p.inicio)}`} → {p.fin === null ? '…' : p.inicio === null ? hm(p.fin) : `${dia(p.fin).slice(0, 5)} ${hm(p.fin)}`}</div>
                </div>
                <span className="whitespace-nowrap text-xs text-texto-2">{p.duracionMin !== null ? duracionTxt(p.duracionMin) : p.fin !== null ? '' : 'sin cierre en el período'}</span>
              </Fila>
            ))}
            {pestana === 'eventos' && avisos.map((f, i) => (
              <Fila key={i}>
                <div className="w-12 shrink-0 font-mono text-sm font-medium">{hm(f.ts)}</div>
                <span className="mt-0.5 flex w-[18px] shrink-0 justify-center">
                  {f.maniobra || esRem(f.texto) ? <span className="text-texto-2" title="Maniobra desde el portal"><Icono nombre="manual" size={18} /></span>
                    : f.tipo === 'alarma' ? <MarcaAlarma size={16} />
                    : COLOR_AVISO[f.tipo] ? <span className="mt-1 h-2.5 w-2.5" style={{ background: COLOR_AVISO[f.tipo] }} /> : null}
                </span>
                <div className="min-w-0 flex-1 text-sm">{f.frase}
                  <div className="text-xs text-texto-2">{f.maniobra ? 'Maniobra desde el portal · ' : /^C\d/i.test(f.texto) ? `${nombreCamara(f.texto.slice(0, 2).toUpperCase())} · ` : ''}{dia(f.ts)}</div>
                </div>
                {f.sigue && <b className="whitespace-nowrap text-xs text-estado-alta">Sigue activo</b>}
              </Fila>
            ))}
          </ul>
          {pestana === 'compresores' && porCamara.map(({ camara, equipos }) => <BloqueEquipos key={camara} camara={camara} equipos={equipos} />)}
          {pestana === 'compresores' && (porCamara[0]?.equipos[0]?.dias.length ?? 0) > 1 && <div className="flex items-center gap-1.5 px-2 py-2 text-xs text-texto-2">
            Cada cuadradito es un día: <span>menos</span>{[0.1, 0.4, 0.7, 1].map(p => <span key={p} className="h-3 w-3" style={{ background: colorPct(p) }} />)}<span>más tiempo en marcha</span>
          </div>}
        </>}
      </Panel>
      <button className="toque border border-borde-campo bg-placa px-4 text-sm font-medium hover:bg-seleccion disabled:opacity-50" disabled={!filas.length}
        onClick={() => downloadXlsx(`${pestana}_${r.desde}_${r.hasta}`, filas)}>Descargar en Excel</button>
    </div>
  )
}
