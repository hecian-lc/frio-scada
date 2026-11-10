import { useEffect, useState } from 'react'
import { apiJson } from '../../lib/api'
import { fechaDia, hhmm } from '../../lib/camaras'
import { useAuthStore, isAdminRole } from '../../store/auth'
import { useBrandingStore } from '../../store/branding'
import { useCamarasStore } from '../../store/camaras'
import { useLiveStore } from '../../store/live'
import { useServerStore } from '../../store/server'
import ReplicaBadge from '../ReplicaBadge'

interface Resultado { ts: number; ok: boolean }
interface Copias { drive: { activo: boolean }; estado: { local?: Resultado; drive?: Resultado } }

const copia = (r?: Resultado) => (!r ? 'sin copias' : `${r.ok ? '' : 'falló '}${fechaDia(r.ts)} ${hhmm(r.ts)}`)

// Barra de estado (solo computadora), 22 px: PLC, servidor, última copia (solo admin) y versión.
export default function BarraEstado() {
  const plc = useCamarasStore(s => s.conectado)
  const servidor = useLiveStore(s => s.connected)
  const replica = useServerStore(s => s.replica)
  const admin = isAdminRole(useAuthStore(s => s.role))
  const footer = useBrandingStore(s => s.footer)
  const [copias, setCopias] = useState<Copias | null>(null)
  // /settings/copias es solo admin (al resto le da 401) y la réplica no hace copias
  const pideCopias = admin && !replica
  useEffect(() => {
    if (!pideCopias) { setCopias(null); return }
    const cargar = () => apiJson<Copias>('/settings/copias').then(setCopias).catch(() => setCopias(null))
    cargar(); const id = setInterval(cargar, 5 * 60000); return () => clearInterval(id)
  }, [pideCopias])
  return (
    <footer className="hidden items-center gap-5 md:flex overflow-hidden whitespace-nowrap bg-marco px-3 text-xs text-marco-texto-2">
      <span>PLC <b className="font-medium text-marco-texto">{plc ? 'conectado' : 'desconectado'}</b></span>
      {replica ? <ReplicaBadge /> : <span>Servidor <b className="font-medium text-marco-texto">{servidor ? 'conectado' : 'reconectando'}</b></span>}
      {copias && <span>Última copia: esta PC <b className="font-medium text-marco-texto">{copia(copias.estado.local)}</b>
        {copias.drive.activo && <> · Drive <b className="font-medium text-marco-texto">{copia(copias.estado.drive)}</b></>}</span>}
      <span className="ml-auto">{footer && <>Powered By <b className="font-medium text-marco-texto">{footer}</b> · </>}v{__APP_VERSION__}</span>
    </footer>
  )
}
