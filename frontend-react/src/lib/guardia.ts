import { useEffect } from 'react'
import { createStore, useStore } from 'zustand'
import { apiJson } from './api'
import { textoAlarma } from './frases'

// Turnos de guardia e instrucciones de "qué hacer" (GET /api/avisos/guardia, cada 5 min).
// Mismo esquema que vistas.ts: un solo sondeo mientras haya al menos un usuario activo.
export interface Turno { nombre: string; desde: string; hasta: string; telefono: string; whatsapp: boolean }
export interface Guardia { turnos: Turno[]; instrucciones: Record<string, string>; actual: Turno | null }

export const guardiaStore = createStore<{ guardia: Guardia }>(() => ({ guardia: { turnos: [], instrucciones: {}, actual: null } }))

// true si el GET salió bien; si falla, el estado queda como estaba
export const recargarGuardia = (): Promise<boolean> => apiJson<Partial<Guardia> | null>('/avisos/guardia')
  .then(r => { guardiaStore.setState({ guardia: { turnos: [], instrucciones: {}, actual: null, ...r } }); return true })
  .catch(() => false)

let activos = 0
let sondeo: ReturnType<typeof setInterval> | undefined
export function activarGuardia(): () => void {
  if (activos++ === 0) { recargarGuardia(); sondeo = setInterval(recargarGuardia, 300000) }
  return () => { if (--activos === 0) { clearInterval(sondeo); sondeo = undefined } }
}

export function useGuardia(activo = true): Guardia {
  const guardia = useStore(guardiaStore, s => s.guardia)
  useEffect(() => (activo ? activarGuardia() : undefined), [activo])
  return guardia
}

// Instrucción del admin para ese tipo de alarma; si no hay, la frase de fábrica
export function instruccion(clave: string, instrucciones: Record<string, string> | undefined): string | undefined {
  // clave de PLC "C4.G2.alarma_res" o de grupo "C4|alarma_res|<desde>"
  const tipo = clave.includes('|') ? clave.split('|')[1] : clave.split('.').pop()!
  return instrucciones?.[tipo] || textoAlarma(tipo).accion
}

export const telHref = (t: string) => 'tel:' + t.replace(/[^\d+]/g, '')
export const waHref = (t: string) => 'https://wa.me/' + t.replace(/\D/g, '')
