import { Sun, Moon, LogOut, Menu } from 'lucide-react'
import { useTheme } from '../../lib/theme'
import { useNow } from '../../lib/useNow'
import { hhmmss } from '../../lib/camaras'
import { useAuthStore, ROLE_LABEL } from '../../store/auth'
import { useBrandingStore } from '../../store/branding'

const boton = 'toque inline-flex w-10 items-center justify-center text-marco-texto-2 hover:bg-marco-2 hover:text-marco-texto md:h-8 md:min-h-0 md:w-8'

// Barra de la app: 40 px en la computadora, 48 px en el celular. ☰ (solo computadora) achica el navegador.
export default function BarraApp({ compacto, alternarMenu }: { compacto: boolean; alternarMenu: () => void }) {
  const { theme, toggle } = useTheme()
  const ahora = useNow(1000)
  const logout = useAuthStore(s => s.logout)
  const role = useAuthStore(s => s.role)
  const user = useAuthStore(s => s.user)
  const logoUrl = useBrandingStore(s => s.logoUrl)
  const brandName = useBrandingStore(s => s.name)
  return (
    <header className="flex h-[48px] shrink-0 items-center gap-3 bg-marco px-3 text-marco-texto md:h-[40px]">
      <button type="button" className={`${boton} -ml-1 hidden md:inline-flex`} onClick={alternarMenu}
        title={compacto ? 'Mostrar el menú' : 'Achicar el menú'} aria-label={compacto ? 'Mostrar el menú' : 'Achicar el menú'} aria-expanded={!compacto}>
        <Menu className="h-5 w-5" />
      </button>
      <img src={logoUrl} alt={brandName} className="h-[28px] w-auto max-w-[140px] object-contain" />
      <span className="truncate text-lg font-semibold">Cámaras de frío</span>
      <div className="ml-auto flex items-center gap-3 text-sm text-marco-texto-2">
        <span className="font-mono text-marco-texto" title="Hora de planta">{hhmmss(ahora)}</span>
        <span className="hidden md:inline" title={`Sesión: ${user} (${role})`}>{user} · {ROLE_LABEL[role] || 'Operador'}</span>
        <div className="flex items-center">
          <button type="button" className={boton} onClick={toggle} title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'} aria-label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button type="button" className={boton} onClick={logout} title="Cerrar sesión" aria-label="Cerrar sesión">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
