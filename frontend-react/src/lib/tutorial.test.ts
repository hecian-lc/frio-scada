import { describe, expect, test } from 'vitest'
import { pasosPara } from './tutorial'

describe('pasos del tutorial', () => {
  test.each(['inicio', 'camara'] as const)('%s: los pasos de administradores solo para admin', t => {
    expect(pasosPara(t, true).length).toBeGreaterThan(pasosPara(t, false).length)
    expect(pasosPara(t, false).some(p => p.soloAdmin)).toBe(false)
  })
  test.each(['inicio', 'camara'] as const)('%s: cada paso tiene elemento, título y texto', t =>
    expect(pasosPara(t, true).every(p => p.titulo && p.texto && p.el)).toBe(true))
})

describe('tutorial de inicio', () => {
  test('apunta a los paneles de Inicio', () => {
    const els = pasosPara('inicio', true).map(p => p.el)
    expect(els.slice(0, 5)).toEqual(['hoy', 'camaras', 'alarma', 'trend', 'eventos'])
    expect(els).not.toContain('semaforo')
  })
})
