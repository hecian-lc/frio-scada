import { lazy, Suspense, useEffect, useMemo, useState, Component, type ReactNode, type ErrorInfo } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { RUTAS_VIEJAS } from './lib/rutas'
import { NavegadorPc, NavegadorCelular } from './components/Navegacion'
import BarraApp from './components/marco/BarraApp'
import BarraEstado from './components/marco/BarraEstado'
import AvisoAlarmaCelular from './components/marco/AvisoAlarmaCelular'
import AvisoConexion from './components/marco/AvisoConexion'
import { Button } from './components/ui/button'
import { FirmaPie } from './components/FirmaHecian'
import { useAlarmasActivas } from './lib/useAlarmasActivas'
import { pantallaDe } from './lib/pantallas'
import { useLiveStore } from './store/live'
import { useConfigStore } from './store/config'
import { useAuthStore, isAdminRole } from './store/auth'
import { useBrandingStore } from './store/branding'
import { useServerStore } from './store/server'
import General from './views/General'
import Camara from './views/Camara'
import Historial from './views/Historial'
import Mas from './views/Mas'
import Avisos from './views/Avisos'
import Reportes from './views/Reportes'
import Sistema from './views/Sistema'
import Login from './views/Login'

class RouteErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null }
  static getDerivedStateFromError(e: Error) { return { error: e } }
  componentDidCatch(e: Error, info: ErrorInfo) { console.error('[RouteErrorBoundary]', e, info) }
  render() {
    if (this.state.error) {
      const msg = (this.state.error as Error).message
      return (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-destructive py-16">
          <div className="text-lg font-bold">Error al cargar la vista</div>
          <pre className="text-xs bg-muted p-3 max-w-xl overflow-auto">{msg}</pre>
          <Button variant="secondary" onClick={() => this.setState({ error: null })}>Reintentar</Button>
        </div>
      )
    }
    return this.props.children
  }
}

const Config        = lazy(() => import('./views/Config'))
const Usuarios      = lazy(() => import('./views/Usuarios'))
const Programacion  = lazy(() => import('./views/Programacion'))

// Vista para operador que intenta entrar a una ruta solo-admin
function NoAutorizado() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground py-16">
      <Lock className="h-10 w-10 opacity-40" />
      <div className="text-lg font-semibold">Acceso restringido</div>
      <p className="text-sm">Esta sección solo está disponible para el rol administrador.</p>
    </div>
  )
}

export default function App() {
  const connect = useLiveStore(s => s.connect)
  const disconnect = useLiveStore(s => s.disconnect)
  const loadConfig = useConfigStore(s => s.load)
  const configLoaded = useConfigStore(s => s.config)
  const authed = useAuthStore(s => s.authed)

  // Marca pública: se carga una vez, antes del login
  useEffect(() => { useBrandingStore.getState().load() }, [])

  useEffect(() => { if (authed) useServerStore.getState().load() }, [authed])

  // Conectar MQTT y cargar config solo con sesion activa (issues #3/#4 de la
  // revision): antes corria una vez pre-login (config daba 401 y nunca se
  // recargaba) y el websocket quedaba abierto incluso deslogueado.
  useEffect(() => {
    if (!authed) return
    connect()
    if (!configLoaded) loadConfig()
    return () => disconnect()
  }, [authed])

  return authed ? <Marco /> : <Login />
}

// Marco de la aplicación (spec §3). Computadora: menú azul a todo el alto y, a la derecha, encabezado 72 (título y
// estado general), aviso de conexión, contenido y barra de estado 36. Celular: encabezado 60, aviso de conexión,
// tarjeta de alarma sin ver, contenido y botones abajo.
function Marco() {
  const { pathname } = useLocation()  // el error de una vista no queda pegado al navegar a otra
  const isAdmin = isAdminRole(useAuthStore(s => s.role))
  const alarmas = useAlarmasActivas()
  const { ruta } = pantallaDe(pathname)

  // ☰ de la barra: navegador completo o solo íconos (se recuerda en este navegador)
  const [compacto, setCompacto] = useState(() => { try { return localStorage.getItem('frio-menu-compacto') === '1' } catch { return false } })
  const alternarMenu = () => { const n = !compacto; setCompacto(n); try { localStorage.setItem('frio-menu-compacto', n ? '1' : '0') } catch { /* sin storage */ } }

  // Mismo elemento entre renders: el refresco de las alarmas no vuelve a pintar la vista
  const contenido = useMemo(() => (
    <RouteErrorBoundary key={pathname}>
      <Suspense fallback={<div className="flex items-center justify-center h-full text-muted-foreground text-sm">Cargando...</div>}>
        <Routes>
          <Route path="/" element={<General />} />
          <Route path="/camara/:c" element={<Camara />} />
          {Object.entries(RUTAS_VIEJAS).map(([de, a]) => <Route key={de} path={de} element={<Navigate to={a} replace />} />)}
          <Route path="/historial/:pestana?" element={<Historial />} />
          <Route path="/alarmas" element={<Historial fija="alarmas" />} />
          <Route path="/eventos" element={<Historial fija="eventos" />} />
          <Route path="/mas" element={<Mas />} />
          <Route path="/avisos" element={<Avisos />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/sistema" element={<Sistema />} />
          <Route path="/usuarios" element={isAdmin ? <Usuarios /> : <NoAutorizado />} />
          <Route path="/programacion" element={isAdmin ? <Programacion /> : <NoAutorizado />} />
          <Route path="/config" element={isAdmin ? <Config /> : <NoAutorizado />} />
        </Routes>
      </Suspense>
    </RouteErrorBoundary>
  ), [pathname, isAdmin])

  return (
    <div className="flex h-screen overflow-hidden bg-suelo supports-[height:100dvh]:h-dvh md:grid md:grid-cols-[auto_1fr]">
      <NavegadorPc compacto={compacto} sinVer={alarmas.sinVer.length} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <BarraApp compacto={compacto} alternarMenu={alternarMenu} alarmas={alarmas.grupos.length} />
        <AvisoConexion />
        <AvisoAlarmaCelular alarmas={alarmas} />
        <main className="min-w-0 flex-1 overflow-auto p-3 md:p-6 md:px-8">
          {/* En el celular el encabezado no lleva el título de la pantalla: va acá, arriba del contenido */}
          <h1 className="mb-3 font-titulo text-xl font-semibold md:hidden">{ruta[ruta.length - 1]}</h1>
          {contenido}
          {/* En el celular no hay barra de estado: la firma va al pie del contenido (marca v0.2.0) */}
          <PieCelular />
        </main>
        <BarraEstado />
        <NavegadorCelular sinVer={alarmas.sinVer.length} />
      </div>
    </div>
  )
}

// Pie del celular, al final de cada pantalla: Powered by del cliente · Desarrollado por HECIAN LC
function PieCelular() {
  const footer = useBrandingStore(s => s.footer)
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-x-1 pb-1 text-xs text-texto-2 md:hidden">
      {footer && <span>Powered by <b className="font-medium text-texto">{footer}</b> ·</span>}
      <FirmaPie />
    </div>
  )
}
