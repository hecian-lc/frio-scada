import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { Panel } from '../components/Panel'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Switch } from '../components/ui/switch'
import { apiJson } from '../lib/api'
import { TIPOS_ALARMA, textoAlarma } from '../lib/frases'
import { recargarGuardia, useGuardia, type Turno } from '../lib/guardia'

const MAX_TURNOS = 6
const VACIO: Turno = { nombre: '', desde: '08:00', hasta: '16:00', telefono: '', whatsapp: false }
const mayus = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export default function GuardiaTab() {
  const { turnos: guardados, instrucciones: instGuardadas, actual } = useGuardia()
  const [turnos, setTurnos] = useState<Turno[] | null>(null)
  const [inst, setInst] = useState<Record<string, string>>({})
  const [guardando, setGuardando] = useState(false)

  // El borrador se inicia una sola vez con lo que llega; el sondeo de 5 min no pisa lo que se está editando.
  useEffect(() => {
    if (turnos === null) { setTurnos(guardados); setInst(instGuardadas) }
  }, [guardados, instGuardadas, turnos])

  const lista = turnos ?? guardados
  const cambiar = (i: number, p: Partial<Turno>) => setTurnos(lista.map((t, j) => (j === i ? { ...t, ...p } : t)))

  async function guardar() {
    setGuardando(true)
    try {
      const instrucciones = Object.fromEntries(Object.entries(inst).filter(([, v]) => v.trim()))
      await apiJson('/avisos/guardia', { method: 'PUT', body: JSON.stringify({ turnos: lista, instrucciones }) })
      toast.success('Guardia guardada')
      await recargarGuardia()
    } catch (e: any) { toast.error(e.message) }
    finally { setGuardando(false) }
  }

  return (
    <div className="max-w-3xl space-y-3">
      <Panel titulo="Turnos de guardia"><div className="space-y-3">
        <p className="text-sm text-muted-foreground">Quién atiende las alarmas en cada horario. Hasta {MAX_TURNOS} turnos.</p>
        <div className="space-y-3">
          {lista.map((t, i) => (
            <div key={i} className="grid grid-cols-2 sm:grid-cols-[1fr_7rem_7rem_1fr_auto_auto] items-end gap-2 border border-linea p-2">
              <div className="col-span-2 sm:col-span-1"><Label>Nombre</Label><Input value={t.nombre} maxLength={40} onChange={e => cambiar(i, { nombre: e.target.value })} /></div>
              <div><Label>Desde</Label><Input type="time" value={t.desde} onChange={e => cambiar(i, { desde: e.target.value })} /></div>
              <div><Label>Hasta</Label><Input type="time" value={t.hasta} onChange={e => cambiar(i, { hasta: e.target.value })} /></div>
              <div className="col-span-2 sm:col-span-1"><Label>Teléfono</Label><Input type="tel" value={t.telefono} maxLength={20} onChange={e => cambiar(i, { telefono: e.target.value })} /></div>
              <label className="toque flex items-center gap-2 text-sm cursor-pointer min-h-[44px] md:min-h-0">
                <Switch checked={t.whatsapp} onCheckedChange={v => cambiar(i, { whatsapp: v })} />WhatsApp
              </label>
              <Button variant="outline" size="sm" className="min-h-[44px] md:min-h-0" aria-label="Quitar turno" onClick={() => setTurnos(lista.filter((_, j) => j !== i))}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" className="min-h-[44px] md:min-h-0" disabled={lista.length >= MAX_TURNOS} onClick={() => setTurnos([...lista, { ...VACIO }])}>
          <Plus className="h-3.5 w-3.5 mr-1" />Agregar turno
        </Button>
        <p className="text-sm">{actual ? `Ahora: ${actual.nombre} (${actual.desde}–${actual.hasta})` : 'Ahora no hay nadie de guardia'}</p>
      </div></Panel>

      <Panel titulo="Qué hacer con cada alarma"><div className="space-y-3">
        {TIPOS_ALARMA.map(tipo => {
          const a = textoAlarma(tipo)
          return (
            <div key={tipo} className="space-y-1">
              <Label htmlFor={`inst-${tipo}`}>{mayus(a.texto)}</Label>
              <textarea id={`inst-${tipo}`} rows={3} maxLength={300} value={inst[tipo] ?? ''} placeholder={a.accion}
                onChange={e => setInst({ ...inst, [tipo]: e.target.value })}
                className="w-full border border-borde-campo bg-placa px-3 py-2 text-sm placeholder:text-muted-foreground" />
              <Button variant="outline" size="sm" className="min-h-[44px] md:min-h-0" onClick={() => setInst({ ...inst, [tipo]: '' })}>Usar la de fábrica</Button>
            </div>
          )
        })}
      </div></Panel>

      <div className="flex justify-end">
        <Button size="sm" disabled={guardando} onClick={guardar}>
          {guardando ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}Guardar
        </Button>
      </div>
    </div>
  )
}
