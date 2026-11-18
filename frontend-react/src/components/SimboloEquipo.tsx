import { useCamarasStore } from '../store/camaras'
import { estaVencido } from '../lib/estadoGrupo'
import { estadoEquipo } from '../lib/frases'
import { useNow } from '../lib/useNow'
import { Icono } from './Icono'

// Cuadrado con el color del estado, su ícono y el número del equipo debajo. Sin dato fresco: violeta con "?".
export function SimboloEquipo({ c, g, size = 24, conTexto }: { c: string; g: number; size?: 24 | 32; conTexto?: boolean }) {
  const estado = useCamarasStore(s => s.estado)
  const recibidoEn = useCamarasStore(s => s.recibidoEn)
  const incompatible = useCamarasStore(s => s.mapa === 'incompatible')
  const ahora = useNow()
  const sinDatos = !estado || incompatible || estaVencido(recibidoEn, ahora)
  const eq = estadoEquipo(sinDatos ? {} : estado, c, g)
  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col items-center gap-0.5">
        <div className="flex items-center justify-center" role="img" aria-label={`Equipo ${g}: ${eq.texto}`}
          style={{ width: size, height: size, background: eq.color, color: eq.sobre, border: eq.borde ? `1px solid ${eq.borde}` : undefined }}>
          <Icono nombre={eq.icono} size={Math.round(size * 0.65)} />
        </div>
        <span className="text-xs font-medium leading-none">{g}</span>
      </div>
      {conTexto && <span className="text-sm">{eq.texto}</span>}
    </div>
  )
}
export default SimboloEquipo
