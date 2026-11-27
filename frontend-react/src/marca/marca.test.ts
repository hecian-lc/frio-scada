import { readFileSync, existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// Marca HECIAN LC v0.2.0: copia de los botones, firma en la app y licencia propietaria (plantillas/ESTANDAR.md)
const leer = (ruta: string) => readFileSync(new URL(ruta, import.meta.url), 'utf8')

describe('marca HECIAN LC v0.2.0', () => {
  it('los botones copiados son los de la v0.2.0 y el deshabilitado no lleva relleno', () => {
    const css = leer('./hecian-botones.css')
    expect(css).toContain('HECIAN LC · botones · v0.2.0')
    const regla = css.slice(css.indexOf('.hlc-btn:disabled'), css.indexOf('}', css.indexOf('.hlc-btn:disabled')))
    expect(regla).toContain('background: transparent')
    expect(regla).toContain('dashed var(--hlc-off-borde)')
  })
  it('están los SVG de la firma y del isotipo en claro y oscuro', () => {
    for (const f of ['firma-claro.svg', 'firma-oscuro.svg', 'isotipo-positivo.svg', 'isotipo-negativo.svg']) {
      expect(existsSync(new URL(`./${f}`, import.meta.url)), f).toBe(true)
    }
  })
  it('package.json declara la licencia propietaria', () => {
    const pkg = JSON.parse(leer('../../package.json'))
    expect(pkg).toMatchObject({ license: 'UNLICENSED', private: true, author: 'HECIAN LC' })
  })
  it('el favicon y los íconos de la PWA son los del isotipo', () => {
    const html = leer('../../index.html')
    expect(html).toContain('href="/favicon.svg"')
    expect(html).toContain('href="/favicon.ico"')
    for (const f of ['favicon.ico', 'favicon.svg', 'favicon-16.png', 'favicon-32.png', 'favicon-48.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-192.png', 'icon-maskable-512.png']) {
      expect(existsSync(new URL(`../../public/${f}`, import.meta.url)), f).toBe(true)
    }
  })
})
