import { useCallback, useEffect, useMemo } from 'react'
import AvisoArranque from '../components/AvisoArranque'
import ResumenHoy from '../components/ResumenHoy'
import TablaCamaras from '../components/TablaCamaras'
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
      <div className="mb-1 text-sm font-semibold">{nombreCamara(cam)}</div>
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
  useEffect(() => { if (!tutorialVisto('inicio', user)) iniciarTutorial('inicio', user, admin) }, [user, admin])
  return (
    <div className="space-y-3">
      <AvisoArranque />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.4fr_1fr]">
        <div className="min-w-0 space-y-3">
          <TablaCamaras />
          <Panel titulo="Qué hizo cada equipo" data-tour="trend">
            <div className="space-y-3">{CAMARAS.map(c => <TrendCamara key={c} cam={c} />)}</div>
          </Panel>
        </div>
        <div className="min-w-0 space-y-3">
          <ResumenHoy />
          <div data-tour="eventos"><EventosHoy eventos={ev.data} error={ev.error} max={8} titulo="Últimos eventos" /></div>
          <NovedadesTurno />
        </div>
      </div>
    </div>
  )
}
