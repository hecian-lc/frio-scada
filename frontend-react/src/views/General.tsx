import { useCallback, useEffect, useMemo, useState } from 'react'
import AvisoArranque from '../components/AvisoArranque'
import Indicadores from '../components/Indicadores'
import TarjetaCamara from '../components/TarjetaCamara'
import TarjetaAlarma from '../components/TarjetaAlarma'
import { Segmentado } from '../components/ui/segmentado'
import TrendEquipos from '../components/TrendEquipos'
import EventosHoy from '../components/EventosHoy'
import NovedadesTurno from '../components/NovedadesTurno'
import { Panel } from '../components/Panel'
import { useCamarasStore } from '../store/camaras'
import { estaVencido } from '../lib/estadoGrupo'
import { aTramos, horariosVista, type TramoApi } from '../lib/paginaCamara'
import type { Evento } from '../lib/alarmas'
import { CAMARAS, PLANTA_OFFSET, nombreCamara, num, diaPlanta, type FilaDescongelado } from '../lib/camaras'
import { useAuthStore } from '../store/auth'
import { useDatos } from '../lib/useDatos'
import { useNow } from '../lib/useNow'
import { iniciarTutorial, tutorialVisto } from '../lib/tutorial'

// Un trend por cámara; componente aparte para que los hooks de datos sean legales dentro del map
function TrendCamara({ cam }: { cam: string }) {
  const estado = useCamarasStore(s => s.estado)
  const recibidoEn = useCamarasStore(s => s.recibidoEn)
  const incompatible = useCamarasStore(s => s.mapa === 'incompatible')
  const ahora = useNow(1000)
  const dia = diaPlanta(ahora)
  const tr = useDatos<TramoApi>('tramos', dia, dia, cam, 60000)
  const filas = useDatos<FilaDescongelado>('descongelados', dia, dia, cam, 60000)
  const tramos = useMemo(() => (tr.data ? aTramos(tr.data) : null), [tr.data])
  const minutosPlan = useCallback((h: number) => estado ? [0, 1].reduce((t, i) => t + (num(estado, `${cam}.H${h}.etapa${i}_habilitada`) === 1 ? Number(estado[`${cam}.H${h}.etapa${i}_min`]) || 0 : 0), 0) : undefined, [estado, cam])
  const sinDatos = !estado || incompatible || estaVencido(recibidoEn, ahora)
  const horarios = estado && !sinDatos ? horariosVista(estado, cam, ahora, filas.error ? null : filas.data) : []
  const dia0 = Date.parse(`${dia}T00:00:00${PLANTA_OFFSET}`)
  return (
    <div>
      <TrendEquipos tramos={tramos} filas={filas.error ? null : filas.data} horarios={horarios} camara={cam} dia0={dia0} ahora={ahora} minutosPlan={minutosPlan} error={tr.error} />
    </div>
  )
}

export default function General() {
  const user = useAuthStore(s => s.user)
  const admin = useAuthStore(s => s.isAdmin())
  const ahora = useNow(60000)
  const dia = diaPlanta(ahora)
  const ev = useDatos<Evento>('eventos', dia, dia, '', 60000)
  const fd = useDatos<FilaDescongelado>('descongelados', dia, dia, '', 60000)
  const filas = fd.error ? null : fd.data
  const [camTrend, setCamTrend] = useState<string>(CAMARAS[0])
  useEffect(() => { if (!tutorialVisto('inicio', user)) iniciarTutorial('inicio', user, admin) }, [user, admin])
  return (
    <div className="space-y-3">
      <AvisoArranque />
      <Indicadores filas={filas} />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_300px]">
        {CAMARAS.map((c, i) => i === 0 ? <div key={c} className="min-w-0" data-tour="camaras"><TarjetaCamara cam={c} filas={filas} /></div> : <TarjetaCamara key={c} cam={c} filas={filas} />)}
        <div className="min-w-0 space-y-3"><div data-tour="alarma"><TarjetaAlarma /></div><NovedadesTurno /></div>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_300px]">
        <Panel grande titulo="Qué hizo cada equipo hoy" data-tour="trend" className="min-w-0"
          accion={<Segmentado aria-label="Cámara del gráfico" activo={camTrend} onCambio={setCamTrend} items={CAMARAS.map(c => ({ id: c, label: nombreCamara(c) }))} />}>
          <TrendCamara cam={camTrend} />
        </Panel>
        <div className="min-w-0" data-tour="eventos"><EventosHoy eventos={ev.data} error={ev.error} max={6} titulo="Últimos eventos" /></div>
      </div>
    </div>
  )
}
