import { afterEach, expect, test, vi } from 'vitest'

// API falsa: GET devuelve lo marcado hasta ahora; POST marca
const marcadas = new Set<string>()
const apiJson = vi.fn(async (path: string, init?: RequestInit) => {
  if (init?.method === 'POST') { for (const c of JSON.parse(String(init.body)).claves) marcadas.add(c); return {} }
  return { activas: [...marcadas].map(clave => ({ clave, visto: { usuario: 'ana', ts: 1 } })) }
})
vi.mock('./api', () => ({ apiJson: (p: string, i?: RequestInit) => apiJson(p, i) }))
const { activarVistas, marcar, vistasStore } = await import('./vistas')

afterEach(() => vi.useRealTimers())

test('dos usuarios de las vistas ven la misma marca apenas se toca Visto, con un solo sondeo', async () => {
  vi.useFakeTimers()
  const vistoPor: string[][] = [[], []]
  // dos consumidores (p. ej. la banda y el panel de la cámara), cada uno escucha el estado compartido
  const quitar = [0, 1].map(i => vistasStore.subscribe(s => { vistoPor[i] = [...s.vistas.keys()] }))
  const bajas = [activarVistas(), activarVistas()]
  expect(apiJson.mock.calls.filter(c => !c[1]).length).toBe(1) // un solo GET al activar, no uno por usuario

  await marcar(['C4.G3.alarma_res'])
  expect(vistoPor).toEqual([['C4.G3.alarma_res'], ['C4.G3.alarma_res']])

  apiJson.mockClear()
  await vi.advanceTimersByTimeAsync(15000)
  expect(apiJson).toHaveBeenCalledTimes(1) // un sondeo cada 15 s para los dos

  bajas.forEach(b => b()); quitar.forEach(q => q())
  apiJson.mockClear()
  await vi.advanceTimersByTimeAsync(30000)
  expect(apiJson).not.toHaveBeenCalled() // sin usuarios activos, sin sondeo
})
