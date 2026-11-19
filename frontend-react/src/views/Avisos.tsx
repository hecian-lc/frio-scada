import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiJson } from '../lib/api'
import { Button } from '../components/ui/button'
import { Panel } from '../components/Panel'
import { authFetch } from '../store/auth'
import { useAuthStore } from '../store/auth'

function Canal({ canal, titulo, boton, admin }: { canal: 'telegram' | 'mail'; titulo: string; boton: string; admin: boolean }) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  async function probar() {
    setBusy(true); setMsg('')
    try {
      const resp = await authFetch('/api/avisos/prueba', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ canal }) })
      const r = await resp.json().catch(() => null) as { ok?: boolean; error?: string } | null
      if (resp.status === 429) setMsg('Esperá un minuto antes de volver a probar')
      else if (resp.ok && r?.ok) setMsg(`Aviso enviado. Fijate en ${titulo}.`)
      else setMsg(`No se pudo: ${r?.error || 'el servidor no respondió bien'}`)
    } catch {
      setMsg('No se pudo: no hay conexión con el servidor')
    } finally { setBusy(false) }
  }
  return (
    <Panel titulo={titulo}>
      <div className="space-y-2">
        {admin && <Button onClick={probar} disabled={busy}>{busy ? 'Enviando…' : boton}</Button>}
        {msg && <p className="text-sm">{msg}</p>}
      </div>
    </Panel>
  )
}

export default function Avisos() {
  const admin = useAuthStore(s => s.isAdmin())
  const [replica, setReplica] = useState(false)
  const [rep, setRep] = useState<{ minutos: number; veces: number } | null>(null)
  useEffect(() => { apiJson<{ replica?: boolean }>('/sistema/resumen').then(r => setReplica(!!r.replica)).catch(() => {}) }, [])
  useEffect(() => { if (admin) apiJson<{ minutos: number; veces: number }>('/settings/repeticion').then(setRep).catch(() => {}) }, [admin])
  const repite = !rep ? 'Mientras siga y nadie toque «Visto», el aviso se repite (se configura en Configuración avanzada)'
    : rep.veces === 0 ? 'El aviso no se repite'
    : `Mientras siga y nadie toque «Visto», el aviso se repite cada ${rep.minutos} min, hasta ${rep.veces} ${rep.veces === 1 ? 'vez' : 'veces'}`
  return (
    <div className="space-y-3 max-w-md">
      {replica ? <p className="text-sm text-texto-2">En la réplica de oficina no se envían avisos</p> : <>
        <Canal canal="telegram" titulo="Telegram" boton="Mandar un aviso de prueba" admin={admin} />
        <Canal canal="mail" titulo="Mail" boton="Mandar un mail de prueba" admin={admin} />
      </>}
      {admin && <Link to="/config?tab=telegram" className="text-sm underline text-primary">Configurar</Link>}
      <Panel titulo="¿Qué avisa?">
        <p className="text-sm text-texto-2">Alarmas del PLC · PLC sin comunicación más de 2 min · reloj del PLC desviado. {repite}. Cuando se resuelve, también avisa.</p>
      </Panel>
    </div>
  )
}
