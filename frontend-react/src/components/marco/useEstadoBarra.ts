import { useCopias } from '../../lib/copias'
import { fechaDia, hhmm } from '../../lib/camaras'
import { useAuthStore, isAdminRole } from '../../store/auth'
import { useBrandingStore } from '../../store/branding'
import { useCamarasStore } from '../../store/camaras'
import { useLiveStore } from '../../store/live'
import { useServerStore } from '../../store/server'

interface Resultado { ts: number; ok: boolean }

export const textoCopia = (r?: Resultado) => (!r ? 'sin copias' : `${r.ok ? '' : 'falló '}${fechaDia(r.ts)} ${hhmm(r.ts)}`)

// Lo que muestra la barra de estado (computadora) y Más › Sistema (celular): PLC, servidor, última copia (solo admin) y pie de marca.
export function useEstadoBarra() {
  const plc = useCamarasStore(s => s.conectado)
  const servidor = useLiveStore(s => s.connected)
  const replica = useServerStore(s => s.replica)
  const admin = isAdminRole(useAuthStore(s => s.role))
  const footer = useBrandingStore(s => s.footer)
  // /settings/copias es solo admin (al resto le da 401) y la réplica no hace copias
  const copias = useCopias(admin && !replica)
  return { plc, servidor, replica, footer, copias }
}
