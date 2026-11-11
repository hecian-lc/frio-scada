import { useState } from 'react'
import { toast } from 'sonner'
import { hhmm } from '../lib/camaras'
import { cn } from '../lib/utils'
import { vistoDe, type Visto } from '../lib/vistas'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'

// "Visto" de un grupo de alarmas activas: corta la repetición de los avisos y queda en Eventos, con una nota opcional.
export default function BotonVisto({ claves, vistas, marcar, texto, className }: { claves: string[]; vistas: Map<string, Visto>; marcar: (c: string[], nota?: string) => Promise<void>; texto?: string; className?: string }) {
  const [abierto, setAbierto] = useState(false)
  const [nota, setNota] = useState('')
  const [enviando, setEnviando] = useState(false)
  const v = vistoDe(vistas, claves)
  if (v) {
    const linea = `Vista por ${v.usuario} a las ${hhmm(v.ts)}`
    return <span className="max-w-[360px] truncate text-xs opacity-80" title={v.nota ? `${linea} — ${v.nota}` : linea}>{linea}{v.nota && <span className="text-texto-2"> — {v.nota}</span>}</span>
  }
  const pendientes = claves.filter(c => !vistas.has(c))
  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setEnviando(true)
    try { await marcar(pendientes, nota.trim() || undefined); toast.success('Alarma marcada como vista'); setAbierto(false) } catch (err: any) { toast.error(err.message || 'No se pudo marcar') } finally { setEnviando(false) }
  }
  return <>
    <button type="button" title="Marcar como vista: deja de repetirse el aviso"
      className={cn('toque ml-1 inline-flex shrink-0 items-center border border-accion bg-accion px-3 text-xs font-semibold text-accion-texto hover:bg-accion-hover disabled:opacity-50', className)}
      onClick={() => { setNota(''); setAbierto(true) }}>Visto</button>
    <Dialog open={abierto} onOpenChange={o => { if (!enviando) setAbierto(o) }}>
      <DialogContent className="w-[calc(100vw-1.5rem)]" aria-describedby={undefined}>
        <DialogHeader><DialogTitle>Marcar como vista</DialogTitle></DialogHeader>
        <form onSubmit={enviar} className="grid gap-3">
          {texto && <p className="text-sm font-semibold text-estado-alta">{texto}</p>}
          <label className="grid gap-1 text-sm">
            Nota (opcional)
            <Input value={nota} maxLength={200} onChange={e => setNota(e.target.value)} autoFocus />
            <span className="justify-self-end font-mono text-xs text-texto-2">{nota.length}/200</span>
          </label>
          <DialogFooter className="gap-2 sm:space-x-0">
            <Button type="button" variant="secondary" onClick={() => setAbierto(false)} disabled={enviando}>Cancelar</Button>
            <Button type="submit" disabled={enviando}>Visto</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </>
}
