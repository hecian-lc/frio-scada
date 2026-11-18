import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Sun, Moon, LogOut, Menu } from 'lucide-react'
import { useTheme } from '../../lib/theme'
import { useNow } from '../../lib/useNow'
import { fechaDia, hhmm, hhmmss } from '../../lib/camaras'
import { estadoConexion, mostrarAviso, textoAlarmas } from '../../lib/conexion'
import { pantallaDe } from '../../lib/pantallas'
import { useAuthStore } from '../../store/auth'
import { useBrandingStore } from '../../store/branding'
import { useCamarasStore } from '../../store/camaras'
import { Pastilla } from '../ui/pastilla'

const botonCelular = 'inline-flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-md text-navegador-texto hover:bg-white/10 hover:text-white'
const boton = 'inline-flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-md text-texto-2 hover:bg-seleccion hover:text-texto'

// Encabezado: 72 px en la computadora, con el único título de la pantalla y el estado general; 60 px azul en el celular.
export default function BarraApp({ compacto, alternarMenu, alarmas }: { compacto: boolean; alternarMenu: () => void; alarmas: number }) {
  const { theme, toggle } = useTheme()
  const ahora = useNow(1000)
  const logout = useAuthStore(s => s.logout)
  const logoUrl = useBrandingStore(s => s.logoUrl)
  const brandName = useBrandingStore(s => s.name)
  const recibidoEn = useCamarasStore(s => s.recibidoEn)
  const ts = useCamarasStore(s => s.ts)
  const { ruta } = pantallaDe(useLocation().pathname)
  const { tipo } = estadoConexion(recibidoEn, ahora)
  const tituloTema = theme === 'dark' ? 'Modo claro' : 'Modo oscuro'
  const enLinea = (tipo === 'ok' || tipo === 'demora') && ts !== null
  const [montadoEn] = useState(Date.now)
  const textoPlc = tipo === 'nunca' && !mostrarAviso(tipo, montadoEn, ahora) ? 'PLC conectando…' : 'PLC sin conexión'
  return <>
    <header className="flex h-[60px] shrink-0 items-center gap-2.5 bg-navegador px-3 text-navegador-texto md:hidden">
      <span className="grid h-[36px] w-[36px] shrink-0 place-items-center rounded-md bg-white p-1">
        <img src={logoUrl} alt={brandName} className="max-h-full max-w-full object-contain" />
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <b className="block truncate text-base font-semibold text-white">{brandName}</b>
        <span className="block truncate text-xs">{enLinea ? `PLC en línea · ${hhmm(ts)}` : textoPlc}</span>
      </span>
      <span className="shrink-0 font-mono text-base text-white" title="Hora de planta">{hhmmss(ahora)}</span>
      <div className="-mr-2 flex shrink-0 items-center">
        <button type="button" className={botonCelular} onClick={toggle} title={tituloTema} aria-label={tituloTema}>
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <button type="button" className={botonCelular} onClick={logout} title="Cerrar sesión" aria-label="Cerrar sesión">
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>

    <header className="hidden h-[72px] shrink-0 items-center gap-4 border-b border-linea bg-panel px-8 md:flex">
      <button type="button" className={`${boton} -ml-3`} onClick={alternarMenu}
        title={compacto ? 'Mostrar el menú' : 'Achicar el menú'} aria-label={compacto ? 'Mostrar el menú' : 'Achicar el menú'} aria-expanded={!compacto}>
        <Menu className="h-5 w-5" />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-bold leading-tight">{ruta[ruta.length - 1]}</h1>
        <div className="text-sm text-texto-2">{fechaDia(ahora)}</div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {alarmas > 0 && <Link to="/alarmas" className="rounded-full"><Pastilla tono="alta">{textoAlarmas(alarmas)}</Pastilla></Link>}
        {enLinea ? <Pastilla tono="ok">PLC en línea ·&nbsp;<span className="font-mono">{hhmmss(ts)}</span></Pastilla> : <Pastilla tono="neutro">{textoPlc}</Pastilla>}
        <span className="hidden font-mono text-lg lg:inline" title="Hora de planta">{hhmmss(ahora)}</span>
        <div className="flex items-center">
          <button type="button" className={boton} onClick={toggle} title={tituloTema} aria-label={tituloTema}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button type="button" className={boton} onClick={logout} title="Cerrar sesión" aria-label="Cerrar sesión">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  </>
}
