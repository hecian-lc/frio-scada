import { Link, useLocation } from 'react-router-dom'
import { IconoNav } from './Icono'
import { cn } from '../lib/utils'
import { pantallaDe, type Codigo } from '../lib/pantallas'
import { useAuthStore, ROLE_LABEL } from '../store/auth'
import { useBrandingStore } from '../store/branding'

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

const iniciales = (u: string) => u.split(/[\s._-]+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase() || '?'

const Contador = ({ n, className }: { n: number; className?: string }) => (
  <span className={cn('grid h-[18px] min-w-[18px] place-items-center rounded-full bg-estado-alta px-1 text-xs font-bold text-estado-alta-sobre', className)}
    aria-label={`${n} ${n === 1 ? 'alarma activa sin ver' : 'alarmas activas sin ver'}`}>{n}</span>
)

// Menú azul a la izquierda desde 768 px, a todo el alto: 232 px (64 con ☰). Marca arriba, usuario abajo.
export function NavegadorPc({ compacto, sinVer }: { compacto: boolean; sinVer: number }) {
  const { codigo } = pantallaDe(useLocation().pathname)
  const logoUrl = useBrandingStore(s => s.logoUrl)
  const brandName = useBrandingStore(s => s.name)
  const user = useAuthStore(s => s.user)
  const role = useAuthStore(s => s.role)
  return (
    <nav aria-label="Principal" className={cn('hidden min-h-0 shrink-0 flex-col gap-1 overflow-y-auto bg-navegador p-3 text-navegador-texto md:flex', compacto ? 'w-[64px]' : 'w-[232px]')}>
      <div className={cn('mb-4 flex items-center gap-2.5', compacto && 'justify-center')}>
        <span className="grid h-[40px] w-[40px] shrink-0 place-items-center rounded-md bg-white p-1">
          <img src={logoUrl} alt={brandName} className="max-h-full max-w-full object-contain" />
        </span>
        {!compacto && <span className="min-w-0 leading-tight">
          <b className="block truncate text-base font-semibold text-white">{brandName}</b>
          <span className="block truncate text-xs">Cámaras de frío</span>
        </span>}
      </div>
      {ITEMS.map(i => {
        const on = i.codigo === codigo
        return (
          <Link key={i.to} to={i.to} data-tour={`nav-${i.icono}`} title={compacto ? i.label : undefined} aria-current={on ? 'page' : undefined}
            className={cn('relative flex h-[42px] shrink-0 items-center gap-2.5 rounded-md px-3 text-base',
              compacto && 'justify-center px-0', on ? 'bg-accion font-semibold text-accion-texto' : 'hover:bg-white/10 hover:text-white')}>
            <IconoNav nombre={i.icono} size={18} />
            <span className={compacto ? 'sr-only' : 'flex-1'}>{i.label}</span>
            {i.codigo === 'A1' && sinVer > 0 && <Contador n={sinVer} className={compacto ? 'absolute right-0.5 top-0.5' : ''} />}
          </Link>
        )
      })}
      <div className={cn('mt-auto flex items-center gap-2.5 pt-4', compacto && 'justify-center')} title={compacto ? `${user} · ${ROLE_LABEL[role] || 'Operador'}` : undefined}>
        <span aria-hidden="true" className="grid h-[36px] w-[36px] shrink-0 place-items-center rounded-full bg-accion text-sm font-semibold text-accion-texto">{iniciales(user)}</span>
        <span className={compacto ? 'sr-only' : 'min-w-0 leading-tight'}>
          <b className="block truncate text-sm font-semibold text-white">{user}</b>
          <span className="block truncate text-xs">{ROLE_LABEL[role] || 'Operador'}</span>
        </span>
      </div>
    </nav>
  )
}

// Barra de botones abajo en el celular: Inicio, Cámaras, Alarmas (con el contador de no vistas), Historial, Más.
export function NavegadorCelular({ sinVer }: { sinVer: number }) {
  const { codigo } = pantallaDe(useLocation().pathname)
  const activo = CELULAR[codigo] ?? codigo
  return (
    <nav aria-label="Principal" className="flex h-[calc(64px+env(safe-area-inset-bottom))] shrink-0 border-t border-linea bg-panel pb-[env(safe-area-inset-bottom)] md:hidden">
      {ITEMS.filter(i => !CELULAR[i.codigo]).map(i => {
        const on = i.codigo === activo
        return (
          <Link key={i.to} to={i.to} data-tour={`nav-${i.icono}`} aria-current={on ? 'page' : undefined}
            className={cn('toque relative flex flex-1 flex-col items-center justify-center gap-0.5 border-t-[3px] text-xs',
              on ? 'border-accion font-semibold text-accion' : 'border-transparent text-texto-2')}>
            <IconoNav nombre={i.icono} />
            {i.label}
            {i.codigo === 'A1' && sinVer > 0 && <Contador n={sinVer} className="absolute left-[calc(50%+6px)] top-[6px]" />}
          </Link>
        )
      })}
    </nav>
  )
}
