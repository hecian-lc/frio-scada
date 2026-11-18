import type { Estado } from '../store/camaras'
import { CAMARAS, GRUPOS, num, nombreCamara, aMin, type FilaDescongelado } from './camaras'
import { estadoEquipo, alarmasActivas, proximoTexto } from './frases'
import { contarDescongelados } from './historial'
import { horariosVista } from './paginaCamara'

const enMarcha = (e: Estado, c: string) => GRUPOS.filter(g => num(e, `${c}.G${g}.comp`) === 1).length

// "hoy 20:00" < "mañana 04:00"; las frases sin hora no compiten
const orden = (t: string) => { const m = /^(hoy|mañana) (\d{2}:\d{2})$/.exec(t); return m ? (m[1] === 'hoy' ? 0 : 1440) + aMin(m[2]) : null }

export function resumenPlanta(estado: Estado, filas: FilaDescongelado[] | null, ahora: number) {
  const fuera = CAMARAS.flatMap(c => GRUPOS.filter(g => estadoEquipo(estado, c, g).clave === 'DESHABILITADO').map(g => `${nombreCamara(c)} equipo ${g}`))
  const proximos = CAMARAS.map(c => ({ c, t: proximoTexto(estado, c, ahora) })).filter(x => orden(x.t) !== null).sort((a, b) => orden(a.t)! - orden(b.t)!)
  return {
    compresores: { en: CAMARAS.reduce((s, c) => s + enMarcha(estado, c), 0), de: CAMARAS.length * GRUPOS.length },
    descongelados: { hechos: filas ? contarDescongelados(filas).hechos : null, de: CAMARAS.reduce((s, c) => s + horariosVista(estado, c, ahora, filas).length, 0) },
    alarmas: alarmasActivas(estado).length,
    fuera: { n: fuera.length, detalle: fuera.join(', ') },
    proximo: proximos.length ? `${nombreCamara(proximos[0].c)}: ${proximos[0].t}` : 'Sin descongelados programados',
  }
}

export function porCamara(estado: Estado, c: string, filas: FilaDescongelado[] | null, ahora: number) {
  const hs = horariosVista(estado, c, ahora, filas)
  return {
    compresores: `${enMarcha(estado, c)}/${GRUPOS.length}`,
    hechos: `${filas ? contarDescongelados(filas.filter(f => f.camara === c)).hechos : '—'} de ${hs.length}`,
    proximo: proximoTexto(estado, c, ahora),
  }
}
