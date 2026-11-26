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
import { Button } from '../ui/button'

// Encabezado: 72 px en la computadora, con el único título de la pantalla y el estado general; 60 px en negro mate en el celular.
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
        <b className="block truncate font-titulo text-lg font-semibold leading-tight text-white">{brandName}</b>
        <span className="block truncate text-xs">{enLinea ? `PLC en línea · ${hhmm(ts)}` : textoPlc}</span>
      </span>
      <span className="shrink-0 font-mono text-base text-white" title="Hora de planta">{hhmmss(ahora)}</span>
      <div className="flex shrink-0 items-center gap-1.5">
        <Button type="button" variant="barra" size="icon" onClick={toggle} title={tituloTema} aria-label={tituloTema}>
          {theme === 'dark' ? <Sun /> : <Moon />}
        </Button>
        <Button type="button" variant="barra" size="icon" onClick={logout} title="Cerrar sesión" aria-label="Cerrar sesión">
          <LogOut />
        </Button>
      </div>
    </header>

    <header className="hidden h-[72px] shrink-0 items-center gap-4 border-b border-linea bg-panel px-8 md:flex">
      <Button type="button" variant="ghost" size="icon" className="-ml-2" onClick={alternarMenu}
        title={compacto ? 'Mostrar el menú' : 'Achicar el menú'} aria-label={compacto ? 'Mostrar el menú' : 'Achicar el menú'} aria-expanded={!compacto}>
        <Menu />
      </Button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-titulo text-xl font-semibold leading-tight">{ruta[ruta.length - 1]}</h1>
        <div className="text-sm text-texto-2">{fechaDia(ahora)}</div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {alarmas > 0 && <Link to="/alarmas" className="rounded-full"><Pastilla tono="alta">{textoAlarmas(alarmas)}</Pastilla></Link>}
        {enLinea ? <Pastilla tono="ok">PLC en línea ·&nbsp;<span className="font-mono">{hhmmss(ts)}</span></Pastilla> : <Pastilla tono="neutro">{textoPlc}</Pastilla>}
        <span className="hidden font-mono text-lg lg:inline" title="Hora de planta">{hhmmss(ahora)}</span>
        <div className="flex items-center">
          <Button type="button" variant="ghost" size="icon" onClick={toggle} title={tituloTema} aria-label={tituloTema}>
            {theme === 'dark' ? <Sun /> : <Moon />}
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={logout} title="Cerrar sesión" aria-label="Cerrar sesión">
            <LogOut />
          </Button>
        </div>
      </div>
    </header>
  </>
}
