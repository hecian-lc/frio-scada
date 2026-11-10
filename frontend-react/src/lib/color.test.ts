import { afterEach, describe, expect, test, vi } from 'vitest'
import { aplicarColorPortal } from './color'
import { contraste } from '../hmi/contraste'

// Sin jsdom en el proyecto: un `style` mínimo en memoria
const props = new Map<string, string>()
const st = {
  setProperty: (k: string, v: string) => void props.set(k, v),
  getPropertyValue: (k: string) => props.get(k) ?? '',
  removeProperty: (k: string) => void props.delete(k),
}
vi.stubGlobal('document', { documentElement: { style: st } })
afterEach(() => aplicarColorPortal(null, 'light'))

describe('color de la marca', () => {
  test('amarillo no se lee en claro: se usa el del tema', () => {
    expect(aplicarColorPortal('#FFEB3B', 'light').usado).toBe(false)
    expect(st.getPropertyValue('--accion')).toBe('')
  })
  test('azul en oscuro se aclara hasta 4.5:1 sobre el panel oscuro', () => {
    expect(aplicarColorPortal('#1F5FAF', 'dark').usado).toBe(true)
    expect(contraste(st.getPropertyValue('--accion'), '#19232F')).toBeGreaterThanOrEqual(4.5)
  })
  test('azul en claro: se usa tal cual, con marco oscuro y texto legible', () => {
    expect(aplicarColorPortal('#1F5FAF', 'light').usado).toBe(true)
    expect(st.getPropertyValue('--accion').toUpperCase()).toBe('#1F5FAF')
    expect(contraste(st.getPropertyValue('--accion-texto'), st.getPropertyValue('--accion'))).toBeGreaterThanOrEqual(4.5)
    expect(contraste(st.getPropertyValue('--marco'), '#FFFFFF')).toBeGreaterThan(10)
  })
  test('null borra los overrides', () => {
    aplicarColorPortal('#1F5FAF', 'light')
    aplicarColorPortal(null, 'light')
    expect(st.getPropertyValue('--accion')).toBe('')
  })
})
