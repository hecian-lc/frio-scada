// Código de pantalla y ruta (spec §2): N1 Inicio … C1 Más. El último elemento de la ruta es el título del encabezado.
import { nombreCamara } from './camaras'

export type Codigo = 'N1' | 'N2' | 'A1' | 'E1' | 'T1' | 'I1' | 'C1'

const HISTORIAL: Record<string, string> = { descongelados: 'Descongelados', compresores: 'Equipos' }
const MAS: Record<string, string> = { mas: '', avisos: 'Avisos', programacion: 'Programación', usuarios: 'Usuarios', sistema: 'Sistema', config: 'Configuración' }

export function pantallaDe(pathname: string): { codigo: Codigo; ruta: string[] } {
  const [p, sub = ''] = pathname.split('/').filter(Boolean)
  if (p === 'camara') return { codigo: 'N2', ruta: ['Cámaras', ...(sub ? [nombreCamara(sub.toUpperCase())] : [])] }
  if (p === 'alarmas') return { codigo: 'A1', ruta: ['Alarmas'] }
  if (p === 'eventos') return { codigo: 'E1', ruta: ['Eventos'] }
  if (p === 'historial') return { codigo: 'T1', ruta: ['Historial', HISTORIAL[sub] ?? HISTORIAL.descongelados] }
  if (p === 'reportes') return { codigo: 'I1', ruta: ['Reportes'] }
  if (p in MAS) return { codigo: 'C1', ruta: ['Más', MAS[p]].filter(Boolean) }
  return { codigo: 'N1', ruta: ['Inicio'] }
}
