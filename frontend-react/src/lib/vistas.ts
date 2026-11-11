import { useEffect } from 'react'
import { createStore, useStore } from 'zustand'
import { apiJson } from './api'

// Quién vio cada alarma activa (GET /api/avisos/activas, cada 15 s) y marcar como vistas (POST /api/avisos/visto).
// "Visto" corta la repetición de los avisos; la alarma sigue activa hasta que el PLC la limpie.
// Estado compartido: banda, aviso, contador, panel de la cámara e Historial ven la misma marca al instante,
// con un solo sondeo mientras haya al menos un usuario activo.
export interface Visto { usuario: string; ts: number; nota?: string }
interface Activa { clave: string; visto: Visto | null }

export const vistasStore = createStore<{ vistas: Map<string, Visto> }>(() => ({ vistas: new Map() }))

const cargar = () => apiJson<{ activas: Activa[] }>('/avisos/activas')
  .then(d => vistasStore.setState({ vistas: new Map(d.activas.filter(a => a.visto).map(a => [a.clave, a.visto!])) }))
  .catch(() => { /* sin API: sin marcas */ })

let activos = 0
let sondeo: ReturnType<typeof setInterval> | undefined
// Suma un usuario activo; el primero arranca el sondeo y el último lo para. Devuelve la baja.
export function activarVistas(): () => void {
  if (activos++ === 0) { cargar(); sondeo = setInterval(cargar, 15000) }
  return () => { if (--activos === 0) { clearInterval(sondeo); sondeo = undefined } }
}

export async function marcar(claves: string[], nota?: string) {
  await apiJson('/avisos/visto', { method: 'POST', body: JSON.stringify(nota ? { claves, nota } : { claves }) })
  await cargar()
}

export function useVistas(activo = true) {
  const vistas = useStore(vistasStore, s => s.vistas)
  useEffect(() => (activo ? activarVistas() : undefined), [activo])
  return { vistas, marcar }
}

// Vista del grupo: la primera marca de sus claves, si todas están vistas
export function vistoDe(vistas: Map<string, Visto>, claves: string[]): Visto | null {
  const v = claves.map(c => vistas.get(c))
  return claves.length && v.every(Boolean) ? (v as Visto[]).reduce((a, b) => (a.ts <= b.ts ? a : b)) : null
}
