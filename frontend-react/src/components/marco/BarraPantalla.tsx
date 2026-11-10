import { useLocation } from 'react-router-dom'
import { pantallaDe } from '../../lib/pantallas'
import { hhmmss } from '../../lib/camaras'
import { useCamarasStore } from '../../store/camaras'

// Barra de pantalla (solo computadora): código y ruta a la izquierda, hora del último dato del PLC a la derecha.
export default function BarraPantalla() {
  const { pathname } = useLocation()
  const ts = useCamarasStore(s => s.ts)
  const { codigo, ruta } = pantallaDe(pathname)
  const titulo = ruta[ruta.length - 1]
  return (
    <div className="hidden items-center gap-3 border-b border-linea bg-barra-pantalla px-3 md:flex">
      <span className="border border-linea bg-panel-titulo px-1.5 py-0.5 font-mono text-xs font-semibold text-panel-titulo-texto">{codigo}</span>
      <span className="flex min-w-0 items-baseline gap-1.5">
        {ruta.slice(0, -1).map(r => <span key={r} className="text-sm text-texto-2">{r} ›</span>)}
        <span className="truncate text-lg font-semibold">{titulo}</span>
      </span>
      <span className="ml-auto text-sm text-texto-2">Dato del PLC: <span className="font-mono text-texto">{ts ? hhmmss(ts) : 'sin datos'}</span></span>
    </div>
  )
}
