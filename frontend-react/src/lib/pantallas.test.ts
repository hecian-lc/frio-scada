import { describe, expect, test } from 'vitest'
import { pantallaDe } from './pantallas'

describe('pantallaDe', () => {
  test('código y ruta de cada pantalla', () => {
    expect(pantallaDe('/')).toEqual({ codigo: 'N1', ruta: ['Inicio'] })
    expect(pantallaDe('/camara/C4')).toEqual({ codigo: 'N2', ruta: ['Cámaras', 'Cámara 4'] })
    expect(pantallaDe('/alarmas').codigo).toBe('A1')
    expect(pantallaDe('/eventos').codigo).toBe('E1')
    expect(pantallaDe('/historial/descongelados')).toEqual({ codigo: 'T1', ruta: ['Historial', 'Descongelados'] })
    expect(pantallaDe('/reportes').codigo).toBe('I1')
    expect(pantallaDe('/config').codigo).toBe('C1')
    expect(pantallaDe('/usuarios').codigo).toBe('C1')
    expect(pantallaDe('/nada').codigo).toBe('N1')
  })
})
