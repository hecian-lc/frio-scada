import { expect, test, vi } from 'vitest'
vi.mock('./api', () => ({ apiJson: vi.fn(() => Promise.resolve({ activas: [] })) }))
import { apiJson } from './api'
import { instruccion, telHref, waHref } from './guardia'
import { marcar } from './vistas'

test('instruccion: admin, fábrica, sin datos de la API', () => {
  expect(instruccion('C4.G2.alarma_res', { alarma_res: 'Llamar a Juan' })).toBe('Llamar a Juan')
  expect(instruccion('C4.G2.alarma_res', {})).toBe('avisar al técnico para revisar la resistencia')
  expect(instruccion('C4.G2.alarma_res', undefined)).toBe('avisar al técnico para revisar la resistencia')
})
test('enlaces de contacto', () => {
  expect(telHref('+598 99-123 456')).toBe('tel:+59899123456')
  expect(waHref('+598 99-123 456')).toBe('https://wa.me/59899123456')
})
test('marcar manda la nota y la omite si está vacía', async () => {
  const cuerpo = () => JSON.parse((vi.mocked(apiJson).mock.calls.find(c => c[0] === '/avisos/visto')![1] as RequestInit).body as string)
  await marcar(['a'], 'n')
  expect(cuerpo()).toEqual({ claves: ['a'], nota: 'n' })
  vi.mocked(apiJson).mockClear()
  await marcar(['a'], '')
  expect(cuerpo()).toEqual({ claves: ['a'] })
})
