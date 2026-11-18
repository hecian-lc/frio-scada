import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Panel } from '../components/Panel'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Switch } from '../components/ui/switch'
import { apiJson } from '../lib/api'
import { fechaHora } from '../lib/camaras'

// Copias de seguridad: semanal (domingos 03:00) en esta PC, y si se prenden, en Google Drive y en una carpeta compartida.
// frio-backup atiende los pedidos ("hacer ahora", "probar") dentro del minuto; acá se ve el resultado de cada destino.
interface Resultado { ts: number; ok: boolean; detalle: string; archivo?: string; ultimaOk?: number | null }
interface Info {
  drive: { activo: boolean; carpeta: string; conectado: boolean }
  red: { activo: boolean; ruta: string; usuario: string; hasPassword: boolean }
  estado: Partial<Record<'local' | 'drive' | 'red' | 'prueba_drive' | 'prueba_red', Resultado>>
}

function Linea({ titulo, r }: { titulo: string; r?: Resultado }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
      <span className="font-medium">{titulo}</span>
      {!r ? <span className="text-muted-foreground">todavía no hay copias</span>
        : <span className={r.ok ? undefined : 'text-destructive'}>
            {r.ok ? 'bien' : 'falló'} · {fechaHora(r.ts).slice(0, 17)} · {r.detalle}
            {!r.ok && r.ultimaOk ? ` (la última buena: ${fechaHora(r.ultimaOk).slice(0, 10)})` : ''}
          </span>}
    </div>
  )
}

export default function CopiasTab() {
  const [info, setInfo] = useState<Info | null>(null)
  const [token, setToken] = useState('')
  const [carpeta, setCarpeta] = useState('')
  const [red, setRed] = useState({ ruta: '', usuario: '', password: '' })
  const [ocupado, setOcupado] = useState(false)
  const espera = useRef<ReturnType<typeof setInterval> | null>(null)

  const cargar = useCallback(() => apiJson<Info>('/settings/copias').then(d => {
    setInfo(d); return d
  }), [])
  useEffect(() => {
    cargar().then(d => { setCarpeta(d.drive.carpeta); setRed({ ruta: d.red.ruta, usuario: d.red.usuario, password: '' }) }).catch(e => toast.error(e.message))
    return () => { if (espera.current) clearInterval(espera.current) }
  }, [cargar])

  // Después de un pedido, refresca cada 10 s durante 3 min hasta que cambie el resultado de esa clave
  function esperar(clave: keyof Info['estado'], antes?: number) {
    if (espera.current) clearInterval(espera.current)
    let n = 0
    espera.current = setInterval(async () => {
      const d = await cargar().catch(() => null)
      const r = d?.estado[clave]
      if (++n >= 18 || (r && r.ts !== antes)) {
        clearInterval(espera.current!); espera.current = null
        if (r && r.ts !== antes) (r.ok ? toast.success : toast.error)(r.detalle)
      }
    }, 10000)
  }

  async function guardar(cambio: object, msg = 'Guardado') {
    setOcupado(true)
    try { const d = await apiJson<Info>('/settings/copias', { method: 'POST', body: JSON.stringify(cambio) }); setInfo(d); toast.success(msg); return true }
    catch (e: any) { toast.error(e.message); return false }
    finally { setOcupado(false) }
  }
  async function pedir(ruta: string, body: object, clave: keyof Info['estado'], msg: string) {
    try { await apiJson(`/settings/copias/${ruta}`, { method: 'POST', body: JSON.stringify(body) }); toast.info(msg); esperar(clave, info?.estado[clave]?.ts) }
    catch (e: any) { toast.error(e.message) }
  }

  if (!info) return <div className="text-muted-foreground text-sm py-8 text-center">Cargando…</div>
  const e = info.estado
  return (
    <div className="max-w-2xl space-y-3">
      <Panel titulo="Copias de seguridad"><div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Todos los domingos a las 03:00 se hace una copia de la base de datos y de la configuración (usuarios, horarios, marca y avisos).
          Queda en esta PC y en los destinos que prendas abajo, con las últimas 12 copias. Si una copia falla, avisa por Telegram y correo.
        </p>
        <Linea titulo="Esta PC" r={e.local} />
        {info.drive.activo && <Linea titulo="Google Drive" r={e.drive} />}
        {info.red.activo && <Linea titulo="Carpeta de red" r={e.red} />}
        <Button size="sm" variant="outline" onClick={() => pedir('ahora', {}, 'local', 'La copia arranca en menos de un minuto; puede tardar unos minutos')}>Hacer una copia ahora</Button>
      </div></Panel>

      <Panel titulo="Google Drive"><div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm">Copiar a Google Drive</span>
          <Switch checked={info.drive.activo} disabled={ocupado || !info.drive.conectado} onCheckedChange={v => guardar({ drive: { activo: v } }, v ? 'Google Drive prendido' : 'Google Drive apagado')} />
        </div>
        <p className="text-sm">{info.drive.conectado ? 'Cuenta conectada.' : 'Todavía no hay una cuenta conectada.'}</p>
        <details className="text-sm" open={!info.drive.conectado}>
          <summary className="cursor-pointer font-medium">{info.drive.conectado ? 'Conectar otra cuenta' : 'Cómo conectar la cuenta (una sola vez)'}</summary>
          <ol className="list-decimal pl-5 space-y-1 mt-2 text-muted-foreground">
            <li>En cualquier PC con Windows, bajá rclone de <a className="underline" href="https://rclone.org/downloads/" target="_blank" rel="noreferrer">rclone.org/downloads</a> (Windows, Intel/AMD 64 bit) y descomprimilo.</li>
            <li>En esa carpeta, abrí una terminal (clic derecho → "Abrir en Terminal") y escribí: <code className="bg-fila-total px-1">.\rclone authorize "drive"</code></li>
            <li>Se abre el navegador: entrá con la cuenta de Google donde querés guardar las copias y tocá "Permitir".</li>
            <li>En la terminal aparece un texto entre <code>---&gt;</code> y <code>&lt;---</code> que empieza con <code>{'{'}</code> y termina con <code>{'}'}</code>. Copialo entero y pegalo acá:</li>
          </ol>
          <textarea value={token} onChange={ev => setToken(ev.target.value)} rows={3} placeholder='{"access_token":"…","refresh_token":"…",…}'
            className="mt-2 w-full border border-borde-campo bg-placa p-2 font-mono text-xs" />
          <Button size="sm" className="mt-1" disabled={ocupado || !token.trim()} onClick={async () => { if (await guardar({ drive: { token, activo: true } }, 'Cuenta de Google Drive conectada')) setToken('') }}>Conectar</Button>
        </details>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[12rem]"><Label htmlFor="drive-carpeta">Carpeta en Drive</Label><Input id="drive-carpeta" value={carpeta} onChange={ev => setCarpeta(ev.target.value)} /></div>
          <Button size="sm" variant="outline" disabled={ocupado || carpeta === info.drive.carpeta} onClick={() => guardar({ drive: { carpeta } })}>Guardar carpeta</Button>
          <Button size="sm" variant="outline" disabled={!info.drive.conectado} onClick={() => pedir('probar', { destino: 'drive' }, 'prueba_drive', 'Probando Google Drive (menos de un minuto)…')}>Probar</Button>
        </div>
        {e.prueba_drive && <Linea titulo="Última prueba" r={e.prueba_drive} />}
      </div></Panel>

      <Panel titulo="Carpeta compartida de otra PC"><div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm">Copiar a la carpeta</span>
          <Switch checked={info.red.activo} disabled={ocupado || !info.red.ruta} onCheckedChange={v => guardar({ red: { activo: v } }, v ? 'Carpeta de red prendida' : 'Carpeta de red apagada')} />
        </div>
        <p className="text-sm text-muted-foreground">Una carpeta compartida de Windows en otra PC de la red. Conviene un usuario de Windows solo para esto, con permiso de escritura en esa carpeta.</p>
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="sm:col-span-3"><Label htmlFor="red-ruta">Ruta</Label><Input id="red-ruta" value={red.ruta} placeholder="\\PC-OFICINA\Copias" onChange={ev => setRed({ ...red, ruta: ev.target.value })} /></div>
          <div><Label htmlFor="red-usuario">Usuario</Label><Input id="red-usuario" value={red.usuario} autoComplete="off" onChange={ev => setRed({ ...red, usuario: ev.target.value })} /></div>
          <div><Label htmlFor="red-pass">Contraseña</Label><Input id="red-pass" type="password" autoComplete="new-password" value={red.password} placeholder={info.red.hasPassword ? '(sin cambios)' : ''} onChange={ev => setRed({ ...red, password: ev.target.value })} /></div>
          <div className="flex items-end gap-2">
            <Button size="sm" disabled={ocupado} onClick={async () => { if (await guardar({ red: { ...red } })) setRed(r => ({ ...r, password: '' })) }}>Guardar</Button>
            <Button size="sm" variant="outline" disabled={!info.red.ruta} onClick={() => pedir('probar', { destino: 'red' }, 'prueba_red', 'Probando la carpeta (menos de un minuto)…')}>Probar</Button>
          </div>
        </div>
        {e.prueba_red && <Linea titulo="Última prueba" r={e.prueba_red} />}
      </div></Panel>
    </div>
  )
}
