import { test, expect } from 'vitest'
import { estadoConexion, textoAlarmas } from './conexion'

test('nunca llegó', () => expect(estadoConexion(null, 1e6)).toEqual({ tipo: 'nunca' }))
test('fresco', () => expect(estadoConexion(1e6 - 3000, 1e6).tipo).toBe('ok'))
test('10 s es demora, no corte (enlace inalámbrico)', () => expect(estadoConexion(1e6 - 10000, 1e6).tipo).toBe('demora'))
test('más de 15 s es corte, con desde y minutos', () => expect(estadoConexion(1e6 - 400000, 1e6)).toEqual({ tipo: 'cortada', desde: 1e6 - 400000, minutos: 6 }))
test('textoAlarmas', () => { expect(textoAlarmas(0)).toBe(''); expect(textoAlarmas(1)).toBe('1 alarma activa'); expect(textoAlarmas(3)).toBe('3 alarmas activas') })
