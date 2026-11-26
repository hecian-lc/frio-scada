import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { contraste, TOKENS } from './contraste'

for (const tema of ['claro', 'oscuro'] as const) {
  describe(tema, () => {
    const t = TOKENS[tema]
    it('texto y texto-2 ≥ 4.5 sobre panel', () => {
      expect(contraste(t['--texto'], t['--panel'])).toBeGreaterThanOrEqual(4.5)
      expect(contraste(t['--texto-2'], t['--panel'])).toBeGreaterThanOrEqual(4.5)
    })
    it('rellenos fuertes ≥ 3 contra panel', () => {
      for (const k of ['--eq-frio', '--eq-desc', '--eq-manual', '--estado-alta', '--estado-invalido']) {
        expect(contraste(t[k], t['--panel'])).toBeGreaterThanOrEqual(3)
      }
    })
    it('borde de escurriendo y de campo ≥ 3 contra panel', () => {
      expect(contraste(t['--eq-escurre-borde'], t['--panel'])).toBeGreaterThanOrEqual(3)
      expect(contraste(t['--borde-campo'], t['--panel'])).toBeGreaterThanOrEqual(3)
    })
    it('ícono ≥ 3 sobre su relleno', () => {
      for (const k of ['--eq-frio', '--eq-desc', '--eq-manual']) {
        expect(contraste(t['--eq-sobre'], t[k])).toBeGreaterThanOrEqual(3)
      }
      expect(contraste(t['--eq-sobre-claro'], t['--eq-escurre'])).toBeGreaterThanOrEqual(3)
    })
    it('texto sobre los fondos suaves ≥ 4.5', () => {
      expect(contraste(t['--alta-texto'], t['--alta-suave'])).toBeGreaterThanOrEqual(4.5)
      expect(contraste(t['--ok-texto'], t['--ok-suave'])).toBeGreaterThanOrEqual(4.5)
      expect(contraste(t['--aviso-texto'], t['--aviso-suave'])).toBeGreaterThanOrEqual(4.5)
      expect(contraste(t['--alta-texto'], t['--panel'])).toBeGreaterThanOrEqual(4.5)
    })
    it('menú y botón primario ≥ 4.5', () => {
      expect(contraste(t['--navegador-texto'], t['--navegador'])).toBeGreaterThanOrEqual(4.5)
      expect(contraste(t['--accion-texto'], t['--accion'])).toBeGreaterThanOrEqual(4.5)
      expect(contraste(t['--accion'], t['--panel'])).toBeGreaterThanOrEqual(4.5)
    })
    it('foco ≥ 3 sobre el panel y sobre el menú; ítem activo del menú ≥ 4.5', () => {
      expect(contraste(t['--foco'], t['--panel'])).toBeGreaterThanOrEqual(3)
      expect(contraste(t['--foco'], t['--navegador'])).toBeGreaterThanOrEqual(3)
      expect(contraste(t['--barra-activo-texto'], t['--barra-activo'])).toBeGreaterThanOrEqual(4.5)
    })
  })
}

describe('TOKENS coincide con tokens.css', () => {
  const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8')
  const hex = (b: string) => Object.fromEntries([...b.matchAll(/(--[\w-]+):\s*(#[0-9A-Fa-f]{6})/g)].map(m => [m[1], m[2].toUpperCase()]))
  const claro = css.slice(css.indexOf(':root {'), css.indexOf('@media (prefers'))
  const oscuro = css.slice(css.indexOf(':root[data-theme="dark"]'), css.indexOf('/* Base'))
  it('claro', () => expect(TOKENS.claro).toEqual(hex(claro)))
  it('oscuro', () => expect(TOKENS.oscuro).toEqual(hex(oscuro)))
})

// Marca HECIAN LC v0.1.0: la acción y el foco del portal son los de los botones de la marca (src/marca/hecian-botones.css)
describe('tokens alineados con la marca', () => {
  const marca = readFileSync(new URL('../marca/hecian-botones.css', import.meta.url), 'utf8')
  const valor = (bloque: string, k: string) => bloque.match(new RegExp(`${k}:\\s*(#[0-9A-Fa-f]{6})`))?.[1].toUpperCase()
  const claro = marca.slice(marca.indexOf(':root {'), marca.indexOf('@media'))
  const oscuro = marca.slice(marca.indexOf(':root[data-theme="dark"]'), marca.indexOf('.hlc-btn {'))
  const pares = [['--accion', '--hlc-accion'], ['--accion-hover', '--hlc-accion-hover'], ['--accion-activo', '--hlc-accion-activo'], ['--accion-texto', '--hlc-accion-texto'], ['--foco', '--hlc-foco']]
  it('claro', () => { for (const [k, h] of pares) expect(TOKENS.claro[k]).toBe(valor(claro, h)) })
  it('oscuro', () => { for (const [k, h] of pares) expect(TOKENS.oscuro[k]).toBe(valor(oscuro, h)) })
})
