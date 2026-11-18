import { Panel } from './Panel'
import MarcaAlarma from './MarcaAlarma'
import { Button } from './ui/button'
import { Pastilla } from './ui/pastilla'
import { useMando, usePermiso } from './Confirmar'
import { num, txt } from '../lib/camaras'
import { repartoTexto, type EstadoHorario, type HorarioVista } from '../lib/paginaCamara'
import type { Estado } from '../store/camaras'

export default function TablaHorarios({ estado, cam, horarios, sinDatos }: { estado: Estado | null; cam: string; horarios: HorarioVista[]; sinDatos: boolean }) {
  const { pedir, enviando, dialogo } = useMando()
  const permiso = usePermiso(5)
  const enCurso = horarios.some(x => x.estado === 'en curso')
  const ref = horarios.find(x => x.estado === 'en curso') ?? horarios.find(x => x.estado === 'próximo')
  const reparto = ref && estado ? repartoTexto(estado, cam, ref.h) : ''
  const etapa = (h: number, i: number) => {
    const m = txt(estado, `${cam}.H${h}.etapa${i}_min`)
    return estado && num(estado, `${cam}.H${h}.etapa${i}_habilitada`) === 1 && m !== '' ? `${m} min` : '—'
  }
  const tono = (e: EstadoHorario) => e === 'en curso' || e === 'próximo' || e === 'pendiente' ? 'accion' : e === 'solapado' || e === 'mal configurado' ? 'aviso' : 'neutro'
  const texto = (e: EstadoHorario) => e === 'próximo' || e === 'pendiente' ? 'programado' : e === 'solapado' || e === 'mal configurado' ? 'revisar' : e
  return (
    <Panel titulo="Descongelados de hoy">
      {sinDatos ? <div className="text-sm text-texto-2">Sin datos</div>
        : horarios.length === 0 ? <div className="text-sm text-texto-2">Sin descongelados programados</div> : (
        <ul className="divide-y divide-linea-fila">{horarios.map(x => (
          <li key={x.h} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 first:pt-0 last:pb-0">
            <span className="font-mono text-base font-semibold">{x.hora}</span>
            <span className="min-w-0 flex-1 text-xs text-texto-2">{x.estado === 'solapado' || x.estado === 'mal configurado' ? x.frase : `Etapa 1 ${etapa(x.h, 0)} · Etapa 2 ${etapa(x.h, 1)}`}{x.nota && ` (${x.nota})`}</span>
            {(x.estado === 'solapado' || x.estado === 'mal configurado') && <MarcaAlarma />}
            <Pastilla tono={tono(x.estado)}>{texto(x.estado)}</Pastilla>
            {x.estado === 'en curso' && <Button variant="outline" className="px-3" disabled={!permiso.ok || enviando} onClick={() => pedir({ comando: 5, camara: cam, valor: 0 })}>Saltar</Button>}
          </li>))}</ul>
      )}
      {reparto && <div className="mt-2 text-xs text-texto-2">{ref!.hora}: {reparto}</div>}
      {!permiso.ok && enCurso && <div className="mt-1 text-xs text-texto-2">Para saltar el descongelado: {permiso.motivo}</div>}
      {dialogo}
    </Panel>
  )
}
