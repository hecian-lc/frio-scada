import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('./api', () => ({ apiJson: vi.fn(() => Promise.resolve({ drive: { activo: false }, estado: {} })) }))
import { apiJson } from './api'
import { activarCopias } from './copias'

beforeEach(() => { vi.useFakeTimers(); vi.mocked(apiJson).mockClear() })
afterEach(() => vi.useRealTimers())

describe('sondeo de copias', () => {
  it('dos usuarios comparten una consulta inicial y una por intervalo', async () => {
    const a = activarCopias(), b = activarCopias()
    expect(apiJson).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(5 * 60000)
    expect(apiJson).toHaveBeenCalledTimes(2)
    a(); await vi.advanceTimersByTimeAsync(5 * 60000)
    expect(apiJson).toHaveBeenCalledTimes(3) // sigue uno activo
    b(); await vi.advanceTimersByTimeAsync(10 * 60000)
    expect(apiJson).toHaveBeenCalledTimes(3) // ninguno: sin sondeo
  })
  it('sin usuarios activos no consulta', () => {
    expect(apiJson).not.toHaveBeenCalled()
  })
})
