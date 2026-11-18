import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { test, expect } from 'vitest'

const leer = (d: string): string =>
  readdirSync(d).map(f => {
    const p = join(d, f)
    if (statSync(p).isDirectory()) return leer(p)
    return p.endsWith('.tsx') ? readFileSync(p, 'utf8') : ''
  }).join('\n')

const anclas = [...readFileSync('src/lib/tutorial.ts', 'utf8').matchAll(/el: '([^']+)'/g)].map(m => m[1])
const fuentes = leer('src')

test('cada paso del tutorial tiene su ancla en algún componente', () => {
  expect(anclas.length).toBeGreaterThan(0)
  for (const el of anclas) expect(fuentes.includes(`data-tour="${el}"`) || (el.startsWith('nav-') && fuentes.includes('data-tour={`nav-'))).toBe(true)
})
