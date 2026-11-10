import { contraste, TOKENS } from '../hmi/contraste'

type Hsl = [number, number, number] // h 0-360, s y l 0-1

function hexAHsl(hex: string): Hsl {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map(v => v / 255)
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min
  let h = 0, s = 0
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1))
    h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
    h = (h * 60 + 360) % 360
  }
  return [h, s, l]
}

function hslAHex([h, s, l]: Hsl): string {
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))))
  }
  return '#' + [f(0), f(8), f(4)].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase()
}

const VARS = ['--accion', '--accion-hover', '--accion-texto', '--marco']

// Color de la marca → --accion y --marco. null = el color del tema (el que trae tokens.css).
// Si el color no llega a 4,5:1 sobre el panel del tema, no se usa y devuelve { usado: false }.
export function aplicarColorPortal(hex: string | null, tema: 'light' | 'dark'): { usado: boolean } {
  const st = document.documentElement.style
  for (const v of VARS) st.removeProperty(v)
  if (!hex) return { usado: false }
  const dark = tema === 'dark'
  const panel = TOKENS[dark ? 'oscuro' : 'claro']['--panel']
  const [h, s, l0] = hexAHsl(hex)
  let l = l0, accion = hex.toUpperCase()
  // en oscuro se aclara de a poco; en claro el color se usa tal cual
  while (dark && contraste(accion, panel) < 4.5 && l < 0.95) { l += 0.01; accion = hslAHex([h, s, l]) }
  if (contraste(accion, panel) < 4.5) return { usado: false }
  const oscuroTxt = TOKENS.oscuro['--accion-texto']
  st.setProperty('--accion', accion)
  st.setProperty('--accion-hover', hslAHex([h, s, Math.max(0, Math.min(1, l + (dark ? 0.08 : -0.08)))]))
  st.setProperty('--accion-texto', contraste('#FFFFFF', accion) >= contraste(oscuroTxt, accion) ? '#FFFFFF' : oscuroTxt)
  st.setProperty('--marco', hslAHex([h, s, Math.min(l0, 0.25)]))
  return { usado: true }
}
