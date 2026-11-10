import { Panel } from './Panel'
import MarcaAlarma from './MarcaAlarma'
import { Button } from './ui/button'
import { useMando, usePermiso } from './Confirmar'
import { num, txt } from '../lib/camaras'
import { repartoTexto, type EstadoHorario, type HorarioVista } from '../lib/paginaCamara'
import type { Estado } from '../store/camaras'

const TEXTO: Record<EstadoHorario, string> = {
  'hecho': 'hecho', 'en curso': 'en curso', 'próximo': 'próximo', 'pendiente': 'pendiente',
  'sin registro': 'sin registro', 'ya pasó': 'ya pasó', 'solapado': 'revisar', 'mal configurado': 'revisar',
}

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
  return (
    <Panel titulo="Horarios y etapas">
      {sinDatos ? <div className="text-sm text-texto-2">Sin datos</div>
        : horarios.length === 0 ? <div className="text-sm text-texto-2">Sin descongelados programados</div> : (
        <table className="w-full text-left text-xs sm:text-sm">
          <thead><tr className="text-xs text-texto-2"><th className="pb-1 pr-2 font-medium">#</th><th className="pb-1 pr-2 font-medium">Hora</th><th className="pb-1 pr-2 font-medium">Etapa 1</th><th className="pb-1 pr-2 font-medium">Etapa 2</th><th className="pb-1 font-medium">Hoy</th></tr></thead>
          <tbody>{horarios.map(x => (
            <tr key={x.h} className="border-t border-linea-fila">
              <td className="py-1 pr-2">{x.h}</td>
              <td className="py-1 pr-2 font-mono font-medium">{x.hora}</td>
              <td className="py-1 pr-2">{etapa(x.h, 0)}</td>
              <td className="py-1 pr-2">{etapa(x.h, 1)}</td>
              <td className="py-1">
                <div className="flex flex-wrap items-center gap-1">
                {(x.estado === 'solapado' || x.estado === 'mal configurado') && <MarcaAlarma />}
                <span>{x.estado === 'solapado' || x.estado === 'mal configurado' ? x.frase : TEXTO[x.estado]}{x.nota && ` (${x.nota})`}</span>
                {x.estado === 'en curso' && <Button variant="outline" className="px-3" disabled={!permiso.ok || enviando} onClick={() => pedir({ comando: 5, camara: cam, valor: 0 })}>Saltar</Button>}
                </div>
              </td>
            </tr>))}</tbody>
        </table>
      )}
      {reparto && <div className="mt-2 text-xs text-texto-2">{ref!.hora}: {reparto}</div>}
      {!permiso.ok && enCurso && <div className="mt-1 text-xs text-texto-2">Para saltar el descongelado: {permiso.motivo}</div>}
      {dialogo}
    </Panel>
  )
}
