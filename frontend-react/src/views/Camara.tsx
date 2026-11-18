import { useParams, Link } from 'react-router-dom'
import AjustesCamara from '../components/AjustesCamara'
import { Panel } from '../components/Panel'
import MarcaAlarma from '../components/MarcaAlarma'
import TarjetaEquipo from '../components/TarjetaEquipo'
import HojaEquipo from '../components/HojaEquipo'
import { Button } from '../components/ui/button'
import { Pastilla } from '../components/ui/pastilla'
import { Segmentado } from '../components/ui/segmentado'
import { usePermiso } from '../components/Confirmar'
import { estadoConexion } from '../lib/conexion'
import { cn } from '../lib/utils'
import PanelAlarmas from '../components/PanelAlarmas'
import TablaHorarios from '../components/TablaHorarios'
import TrendEquipos from '../components/TrendEquipos'
import EventosHoy from '../components/EventosHoy'
import { useCamarasStore } from '../store/camaras'
import { useAuthStore } from '../store/auth'
import { fraseCamara, faltanMin, badgeCamara, proximoTexto, alarmasActivas } from '../lib/frases'
import { CAMARAS, PLANTA_OFFSET, GRUPOS, nombreCamara, txt, num, hhmm, diaPlanta, type FilaDescongelado } from '../lib/camaras'
import { useNow } from '../lib/useNow'
import { useDatos } from '../lib/useDatos'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { iniciarTutorial, tutorialVisto } from '../lib/tutorial'
import { aTramos, horariosVista, type TramoApi } from '../lib/paginaCamara'
import { agruparActivas, alarmasActivasVista, ultimoPorClave, type Evento } from '../lib/alarmas'

const MODOS: Record<string, string> = { AUTOMATICO: 'Automático', MANUAL: 'Manual', STOP: 'Detenido' }

export default function Camara() {
  const { c } = useParams()
  const cam = (c ?? '').toUpperCase()
  const estado = useCamarasStore(s => s.estado)
  const ts = useCamarasStore(s => s.ts)
  const recibidoEn = useCamarasStore(s => s.recibidoEn)
  const incompatible = useCamarasStore(s => s.mapa === 'incompatible')
  const admin = useAuthStore(s => s.isAdmin())
  const [ajustes, setAjustes] = useState(false)
  const [hoja, setHoja] = useState<number | null>(null)
  const permiso = usePermiso(1)
  const user = useAuthStore(s => s.user)
  const ahora = useNow(1000)
  const dia = diaPlanta(ahora)
  const valida = (CAMARAS as readonly string[]).includes(cam)
  useEffect(() => { if (valida && !tutorialVisto('camara', user)) iniciarTutorial('camara', user, admin) }, [valida, user, admin])
  const tr = useDatos<TramoApi>('tramos', dia, dia, valida ? cam : '', 60000)
  const filas = useDatos<FilaDescongelado>('descongelados', dia, dia, valida ? cam : '', 60000)
  const tramos = useMemo(() => (tr.data ? aTramos(tr.data) : null), [tr.data])
  const minutosPlan = useCallback((h: number) => estado ? [0, 1].reduce((t, i) => t + (num(estado, `${cam}.H${h}.etapa${i}_habilitada`) === 1 ? Number(estado[`${cam}.H${h}.etapa${i}_min`]) || 0 : 0), 0) : undefined, [estado, cam])
  const ev = useDatos<Evento>('eventos', dia, dia, valida ? cam : '', 60000)
  const ultimos = useMemo(() => ultimoPorClave(ev.data ?? []), [ev.data])
  if (!valida) return <div className="text-center text-texto-2 py-16">Cámara inexistente. <Link className="underline" to="/">Volver</Link></div>

  const tipo = estadoConexion(recibidoEn, ahora).tipo
  const sinDatos = !estado || incompatible || tipo === 'nunca'
  const atenuado = !sinDatos && (tipo === 'demora' || tipo === 'cortada')
  const f = estado && !sinDatos ? fraseCamara(estado, cam, ahora) : null
  const hayDatos = !!f && f.nivel !== 'sin-datos'
  const badge = hayDatos ? badgeCamara(estado!, cam, f!.nivel) : null
  const modo = hayDatos ? MODOS[txt(estado, `${cam}.modo`)] : undefined
  const falta = hayDatos ? faltanMin(estado!, cam) : null
  const proximo = hayDatos && falta == null ? (p => p.startsWith('Sin') ? p : `Próximo descongelado: ${p}`)(proximoTexto(estado!, cam, ahora)) : null
  const dia0 = Date.parse(`${dia}T00:00:00${PLANTA_OFFSET}`)
  const horarios = estado && !sinDatos ? horariosVista(estado, cam, ahora, filas.error ? null : filas.data) : []
  // Sin eventos cargados (cargando o con error) no se sabe desde cuándo: desde = undefined
  const alarmas = estado && !sinDatos ? agruparActivas(alarmasActivasVista(estado, ultimos, cam).map(a => ev.data && !ev.error && !ev.cargando ? a : { ...a, desde: undefined }), { camaraImplicita: cam }) : null

  const conAlarma = (k: string) => !!estado && !incompatible && alarmasActivas(estado, k).length > 0
  const sinConexion = () => incompatible ? 'El PLC tiene un programa viejo' : ts ? `Sin datos desde ${hhmm(ts)}` : 'Sin datos todavía'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div data-tour="cam-selector"><Segmentado grande aria-label="Cámara" activo={cam} items={CAMARAS.map(k => ({ id: k, label: nombreCamara(k), to: `/camara/${k}`, marca: conAlarma(k) }))} /></div>
        <div data-tour="cam-estado" className="flex flex-wrap items-center gap-2">
          {atenuado && ts && <Pastilla tono="neutro">Último dato {hhmm(ts)}</Pastilla>}
          {modo && <Pastilla tono="neutro">{modo}</Pastilla>}
          {falta != null ? <Pastilla tono="accion">faltan {falta} min</Pastilla> : proximo && <Pastilla tono="neutro">{proximo}</Pastilla>}
          {sinDatos && <span className="text-sm text-texto-2">{sinConexion()}</span>}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {badge && <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-alta-texto"><MarcaAlarma />{badge.t}</span>}
          {admin && <span data-tour="cam-ajustes"><Button variant="outline" className="max-md:min-h-[44px]" onClick={() => setAjustes(true)}>Ajustes</Button></span>}
        </div>
        {admin && ajustes && <AjustesCamara cam={cam} onCerrar={() => setAjustes(false)} />}
      </div>
      {hayDatos && <div><div className="text-sm font-semibold">{f!.titulo}</div>{f!.detalle && <div className="text-xs text-texto-2">{f!.detalle}</div>}</div>}

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-4">
          <div data-tour="cam-equipos" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {GRUPOS.map(g => <TarjetaEquipo key={`${cam}${g}`} estado={estado} cam={cam} g={g} hayDatos={hayDatos} atenuado={atenuado} onCambiar={() => setHoja(g)} />)}
          </div>
          {!permiso.ok && <div className="text-xs text-texto-2">{permiso.motivo}</div>}
          {hoja != null && <HojaEquipo cam={cam} g={hoja} onCerrar={() => setHoja(null)} />}
          <div data-tour="cam-trend" className={cn(atenuado && 'opacity-[.55] grayscale-[.6]')}><TrendEquipos tramos={tramos} filas={filas.error ? null : filas.data} horarios={horarios} camara={cam} dia0={dia0} ahora={ahora} minutosPlan={minutosPlan} error={tr.error} /></div>
        </div>
        <div className={cn('min-w-0 space-y-4', atenuado && '[&>div]:opacity-[.55] [&>div]:grayscale-[.6]')}>
          <div data-tour="cam-horarios"><TablaHorarios estado={estado} cam={cam} horarios={horarios} sinDatos={sinDatos} /></div>
          <div data-tour="cam-alarmas"><PanelAlarmas alarmas={alarmas} /></div>
          <div data-tour="cam-eventos"><EventosHoy eventos={ev.data} error={ev.error} /></div>
        </div>
      </div>
    </div>
  )
}
