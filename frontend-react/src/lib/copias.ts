import { useEffect } from 'react'
import { createStore, useStore } from 'zustand'
import { apiJson } from './api'

// Última copia de seguridad (GET /api/settings/copias, cada 5 min). Un solo sondeo compartido
// por la barra de estado y Más › Sistema, mientras haya al menos un usuario activo.
interface Resultado { ts: number; ok: boolean }
export interface Copias { drive: { activo: boolean }; estado: { local?: Resultado; drive?: Resultado } }

export const copiasStore = createStore<{ copias: Copias | null }>(() => ({ copias: null }))

const cargar = () => apiJson<Copias>('/settings/copias')
  .then(copias => copiasStore.setState({ copias }))
  .catch(() => copiasStore.setState({ copias: null }))

let activos = 0
let sondeo: ReturnType<typeof setInterval> | undefined
export function activarCopias(): () => void {
  if (activos++ === 0) { cargar(); sondeo = setInterval(cargar, 5 * 60000) }
  return () => { if (--activos === 0) { clearInterval(sondeo); sondeo = undefined; copiasStore.setState({ copias: null }) } }
}

// activo = admin y no réplica (a los demás /settings/copias les da 401)
export function useCopias(activo: boolean) {
  const copias = useStore(copiasStore, s => s.copias)
  useEffect(() => (activo ? activarCopias() : undefined), [activo])
  return activo ? copias : null
}
