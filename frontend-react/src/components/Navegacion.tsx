import { Link, useLocation } from 'react-router-dom'
import { IconoNav } from './Icono'
import { cn } from '../lib/utils'
import { pantallaDe, type Codigo } from '../lib/pantallas'

type Item = { to: string; label: string; icono: Parameters<typeof IconoNav>[0]['nombre']; codigo: Codigo }
const ITEMS: Item[] = [
  { to: '/', label: 'Inicio', icono: 'inicio', codigo: 'N1' },
  { to: '/camara/C4', label: 'Cámaras', icono: 'camaras', codigo: 'N2' },
  { to: '/alarmas', label: 'Alarmas', icono: 'alarmas', codigo: 'A1' },
  { to: '/eventos', label: 'Eventos', icono: 'eventos', codigo: 'E1' },
  { to: '/historial', label: 'Historial', icono: 'historial', codigo: 'T1' },
  { to: '/reportes', label: 'Reportes', icono: 'reportes', codigo: 'I1' },
  { to: '/mas', label: 'Más', icono: 'mas', codigo: 'C1' },
]
// En el celular no hay Eventos (entra desde Alarmas) ni Reportes (está en Más): esas pantallas marcan su botón padre
const CELULAR: Partial<Record<Codigo, Codigo>> = { E1: 'A1', I1: 'C1' }

// Navegador a la izquierda desde 768 px (248 px, 56 con ☰), con el código de cada pantalla.
export function NavegadorPc({ compacto }: { compacto: boolean }) {
  const { codigo } = pantallaDe(useLocation().pathname)
  return (
    <nav aria-label="Principal" className={cn('hidden shrink-0 flex-col overflow-y-auto border-r border-linea bg-navegador py-2 md:flex', compacto ? 'w-[56px]' : 'w-[248px]')}>
      {ITEMS.map(i => {
        const on = i.codigo === codigo
        return (
          <Link key={i.to} to={i.to} data-tour={`nav-${i.icono}`} title={compacto ? i.label : undefined} aria-current={on ? 'page' : undefined}
            className={cn('flex min-h-[32px] items-center gap-2.5 border-l-[3px] px-3 text-base text-texto hover:bg-seleccion',
              compacto && 'justify-center px-0', on ? 'border-accion bg-seleccion font-semibold' : 'border-transparent')}>
            <IconoNav nombre={i.icono} size={18} />
            <span className={compacto ? 'sr-only' : ''}>{i.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

// Barra de botones abajo en el celular: Inicio, Cámaras, Alarmas (con el contador de no vistas), Historial, Más.
export function NavegadorCelular({ sinVer }: { sinVer: number }) {
  const { codigo } = pantallaDe(useLocation().pathname)
  const activo = CELULAR[codigo] ?? codigo
  return (
    <nav aria-label="Principal" className="flex h-[calc(56px+env(safe-area-inset-bottom))] shrink-0 border-t border-linea bg-panel pb-[env(safe-area-inset-bottom)] md:hidden">
      {ITEMS.filter(i => !CELULAR[i.codigo]).map(i => {
        const on = i.codigo === activo
        return (
          <Link key={i.to} to={i.to} data-tour={`nav-${i.icono}`} aria-current={on ? 'page' : undefined}
            className={cn('toque relative flex flex-1 flex-col items-center justify-center gap-0.5 border-t-[3px] text-xs',
              on ? 'border-accion font-semibold text-accion' : 'border-transparent text-texto-2')}>
            <IconoNav nombre={i.icono} />
            {i.label}
            {i.codigo === 'A1' && sinVer > 0 && (
              <span className="absolute left-[calc(50%+6px)] top-[6px] grid h-[18px] min-w-[18px] place-items-center rounded-full bg-estado-alta px-1 text-xs font-bold text-estado-alta-sobre"
                aria-label={`${sinVer} ${sinVer === 1 ? 'alarma activa sin ver' : 'alarmas activas sin ver'}`}>{sinVer}</span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
