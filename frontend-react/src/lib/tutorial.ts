// Tutoriales guiados de la primera vez (Inicio + menú, y la página de una cámara). Los textos de cada paso viven acá.
// Cada uno se marca como visto por usuario en este navegador; "Ver el tutorial de nuevo" (Más) los borra.
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

export interface Paso { el: string; titulo: string; texto: string; soloAdmin?: boolean }

export type Tutorial = 'inicio' | 'camara'

const INICIO: Paso[] = [
  { el: 'camaras', titulo: 'Cámaras', texto: 'Una fila por cámara con un cuadrado por equipo: azul enfriando, verde azulado descongelando, celeste escurriendo, gris azulado manual, blanco o gris con borde apagado, cuadrado rojo con "!" en alarma y violeta con "?" sin datos. Tocá la fila para ver el detalle de la cámara.' },
  { el: 'trend', titulo: 'Qué hizo cada equipo', texto: 'Lo que hizo cada equipo hoy, hora por hora, una cámara debajo de la otra. La línea azul es la hora actual.' },
  { el: 'hoy', titulo: 'Hoy', texto: 'Por cámara: descongelados hechos, alarmas activas y compresores en marcha. La última fila es el total de la planta. "—" quiere decir que no hay dato.' },
  { el: 'eventos', titulo: 'Últimos eventos', texto: 'Lo último que pasó en las cámaras, con la hora. "Ver todos" lleva a la página de Eventos.' },
  { el: 'nav-camaras', titulo: 'Cámaras', texto: 'El detalle de cada cámara: el gráfico de las últimas horas, los equipos y los horarios de descongelado.' },
  { el: 'nav-alarmas', titulo: 'Alarmas', texto: 'Las alarmas activas ahora y las que hubo en los días anteriores, con cuánto duraron.' },
  { el: 'nav-eventos', titulo: 'Eventos', texto: 'Todo lo que pasó: cambios de modo, descongelados, maniobras desde el portal.' },
  { el: 'nav-historial', titulo: 'Historial', texto: 'Los descongelados hechos y cuánto trabajó cada equipo, por día. Se puede bajar a Excel.' },
  { el: 'nav-mas', titulo: 'Más', texto: 'El reporte diario en PDF, los avisos por Telegram y mail y el estado del sistema.' },
  { el: 'nav-mas', titulo: 'Para administradores', texto: 'En Más también están la Programación de descongelados, los Usuarios y la Configuración avanzada. Los ajustes de cada cámara están en el botón ⚙ Ajustes de su página.', soloAdmin: true },
]

const CAMARA: Paso[] = [
  { el: 'cam-selector', titulo: 'Elegir la cámara', texto: 'Desde acá se pasa de una cámara a la otra.' },
  { el: 'cam-estado', titulo: 'Cómo está la cámara', texto: 'El modo en que está, cuándo es el próximo descongelado (o cuánto le falta al que está en curso) y el estado general. Si hay una alarma aparece un cuadrado rojo con "!".' },
  { el: 'cam-equipos', titulo: 'Los equipos', texto: 'Cada equipo con su estado y sus salidas: C compresor, E evaporador, R resistencia (una salida prendida se ve con un cuadrado lleno, azul; la resistencia descongelando, verde azulado; apagada, cuadrado vacío). También los arranques, las horas de marcha y el tiempo desde su último descongelado.' },
  { el: 'cam-equipos', titulo: 'Manejar un equipo', texto: 'Con "Cambiar…" se puede pasar un equipo a automático, fuera de servicio o manual, o cortar un descongelado. Solo para usuarios que pueden operar y con la llave de mando remoto habilitada en el tablero.' },
  { el: 'cam-alarmas', titulo: 'Alarmas de la cámara', texto: 'Las alarmas activas de esta cámara y qué hacer con cada una. Con "Visto" avisás que ya la viste: el aviso deja de repetirse por Telegram y correo.' },
  { el: 'cam-horarios', titulo: 'Horarios de hoy', texto: 'Los horarios de descongelado del día: cuáles ya se hicieron, cuál está en curso y cuál es el próximo.' },
  { el: 'cam-trend', titulo: 'Gráfico del día', texto: 'Lo que hizo cada equipo hoy, hora por hora: azul enfriando, verde azulado descongelando, celeste escurriendo, gris azulado en manual, blanco con borde apagado y rayado sin datos. La línea azul "ahora" es la hora actual y las marcas de arriba son los horarios programados. Pasá el mouse (o tocá) para ver el detalle de ese momento.' },
  { el: 'cam-eventos', titulo: 'Eventos de hoy', texto: 'Lo último que pasó en esta cámara. "Ver todos" lleva a la página de Eventos.' },
  { el: 'cam-ajustes', titulo: 'Ajustes', texto: 'Los horarios de descongelado, las duraciones y qué equipos van en cada etapa de esta cámara.', soloAdmin: true },
]

const PASOS: Record<Tutorial, Paso[]> = { inicio: INICIO, camara: CAMARA }
export const pasosPara = (t: Tutorial, admin: boolean) => PASOS[t].filter(p => admin || !p.soloAdmin)

const clave = (t: Tutorial, user: string) => `frio_tutorial_${t}_visto_${user || 'anon'}`
export function tutorialVisto(t: Tutorial, user: string): boolean {
  try { return localStorage.getItem(clave(t, user)) === '1' } catch { return true } // sin storage: no molestar en cada entrada
}
export function marcarTutorial(t: Tutorial, user: string, visto: boolean) {
  try { if (visto) localStorage.setItem(clave(t, user), '1'); else localStorage.removeItem(clave(t, user)) } catch { /* sin storage */ }
}

// El menú está dos veces (navegador de la computadora y barra del celular, una oculta): se usa el que se ve
const visible = (el: string) => [...document.querySelectorAll(`[data-tour="${el}"]`)].find(e => e.getClientRects().length > 0)

export function iniciarTutorial(t: Tutorial, user: string, admin: boolean) {
  const d = driver({
    showProgress: true,
    progressText: '{{current}} de {{total}}',
    nextBtnText: 'Siguiente',
    prevBtnText: 'Anterior',
    doneBtnText: 'Listo',
    allowClose: true,
    // los pasos cuyo elemento no está (p. ej. sin cámaras) se saltean
    steps: pasosPara(t, admin).map(p => ({ element: visible(p.el), popover: { title: p.titulo, description: p.texto } }))
      .filter(s => s.element),
    onDestroyed: () => marcarTutorial(t, user, true), // terminado o cerrado: no vuelve a salir
  })
  d.drive()
}
