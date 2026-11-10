import { useState } from 'react'
import { toast } from 'sonner'
import { hhmm } from '../lib/camaras'
import { cn } from '../lib/utils'
import { vistoDe, type Visto } from '../lib/vistas'

// "Visto" de un grupo de alarmas activas: corta la repetición de los avisos y queda en Eventos.
export default function BotonVisto({ claves, vistas, marcar, className }: { claves: string[]; vistas: Map<string, Visto>; marcar: (c: string[]) => Promise<void>; className?: string }) {
  const [enviando, setEnviando] = useState(false)
  const v = vistoDe(vistas, claves)
  if (v) return <span className="text-xs opacity-80">Vista por {v.usuario} a las {hhmm(v.ts)}</span>
  const pendientes = claves.filter(c => !vistas.has(c))
  return (
    <button type="button" disabled={enviando} title="Marcar como vista: deja de repetirse el aviso"
      className={cn('toque ml-1 inline-flex shrink-0 items-center border border-accion bg-accion px-3 text-xs font-semibold text-accion-texto hover:bg-accion-hover disabled:opacity-50', className)}
      onClick={async () => {
        setEnviando(true)
        try { await marcar(pendientes); toast.success('Alarma marcada como vista') } catch (e: any) { toast.error(e.message || 'No se pudo marcar') } finally { setEnviando(false) }
      }}>Visto</button>
  )
}
