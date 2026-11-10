import { useEffect, useState } from 'react'
import { apiJson } from '../../lib/api'
import { fechaDia, hhmm } from '../../lib/camaras'
import { useAuthStore, isAdminRole } from '../../store/auth'
import { useBrandingStore } from '../../store/branding'
import { useCamarasStore } from '../../store/camaras'
import { useLiveStore } from '../../store/live'
import { useServerStore } from '../../store/server'

interface Resultado { ts: number; ok: boolean }
export interface Copias { drive: { activo: boolean }; estado: { local?: Resultado; drive?: Resultado } }

export const textoCopia = (r?: Resultado) => (!r ? 'sin copias' : `${r.ok ? '' : 'falló '}${fechaDia(r.ts)} ${hhmm(r.ts)}`)

// Lo que muestra la barra de estado (computadora) y Más › Sistema (celular): PLC, servidor, última copia (solo admin) y pie de marca.
export function useEstadoBarra() {
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
  return { plc, servidor, replica, footer, copias }
}
