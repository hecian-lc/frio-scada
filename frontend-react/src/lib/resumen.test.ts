import { test, expect } from 'vitest'
import type { Estado } from '../store/camaras'
import { resumenPlanta, porCamara } from './resumen'

const AHORA = Date.UTC(2026, 9, 16, 15, 0) // 12:00 de planta
// C4: equipos 1-6 en marcha, 7 DETENIDO, 8 DESHABILITADO. C5: equipos 1-5 en marcha, 6-8 DETENIDO. Total en marcha: 11.
const est: Estado = {}
for (const [c, n] of [['C4', 6], ['C5', 5]] as const) {
  for (let g = 1; g <= 8; g++) { est[`${c}.G${g}.estado`] = g <= n ? 'FRIO' : 'DETENIDO'; est[`${c}.G${g}.comp`] = g <= n ? 1 : 0 }
}
est['C4.G8.estado'] = 'DESHABILITADO'
// Horarios habilitados: 3 en C4 (un DESHABILITADO que no cuenta), 2 en C5
;[['C4', ['16:00', '20:00', '22:00']], ['C5', ['18:00', '23:00']]].forEach(([c, hs]) => (hs as string[]).forEach((h, i) => { est[`${c}.H${i + 1}.estado`] = 'PROGRAMADO'; est[`${c}.H${i + 1}.hora`] = h }))
est['C4.H4.estado'] = 'DESHABILITADO'; est['C4.H4.hora'] = '04:00'

test('compresores en marcha sobre 16', () => expect(resumenPlanta(est, [], AHORA).compresores).toEqual({ en: 11, de: 16 }))
test('fuera de servicio cuenta solo DESHABILITADO, no DETENIDO', () => expect(resumenPlanta(est, [], AHORA).fuera).toEqual({ n: 1, detalle: 'Cámara 4 equipo 8' }))
test('descongelados de = horarios habilitados de las dos cámaras', () => expect(resumenPlanta(est, [], AHORA).descongelados.de).toBe(5))
test('sin filas todavía, hechos es null', () => expect(resumenPlanta(est, null, AHORA).descongelados.hechos).toBeNull())
test('próximo: el más temprano con nombre de cámara', () => expect(resumenPlanta(est, [], AHORA).proximo).toBe('Cámara 4: hoy 16:00'))
test('porCamara', () => expect(porCamara(est, 'C4', [], AHORA)).toEqual({ compresores: '6/8', hechos: '0 de 3', proximo: 'hoy 16:00' }))
