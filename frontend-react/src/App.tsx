import { lazy, Suspense, useEffect, useMemo, useState, Component, type ReactNode, type ErrorInfo } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { RUTAS_VIEJAS } from './lib/rutas'
import { NavegadorPc, NavegadorCelular } from './components/Navegacion'
import BarraApp from './components/marco/BarraApp'
import BarraPantalla from './components/marco/BarraPantalla'
import BandaAlarmas from './components/marco/BandaAlarmas'
import BarraEstado from './components/marco/BarraEstado'
import AvisoAlarmaCelular from './components/marco/AvisoAlarmaCelular'
import { useAlarmasActivas } from './lib/useAlarmasActivas'
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
          <button className="text-xs underline" onClick={() => this.setState({ error: null })}>Reintentar</button>
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

// Marco de la aplicación (spec §2). Computadora: barra de la app 40, barra de pantalla 36, navegador + contenido,
// banda de alarmas 32 y barra de estado 22. Celular: barra de 48, aviso de alarma sin ver, contenido y botones abajo.
function Marco() {
  const { pathname } = useLocation()  // el error de una vista no queda pegado al navegar a otra
  const isAdmin = isAdminRole(useAuthStore(s => s.role))
  const alarmas = useAlarmasActivas()

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
    <div className="flex h-screen flex-col overflow-hidden bg-suelo supports-[height:100dvh]:h-dvh md:grid md:grid-rows-[40px_36px_1fr_32px_22px]">
      <BarraApp compacto={compacto} alternarMenu={alternarMenu} />
      <BarraPantalla />
      <AvisoAlarmaCelular alarmas={alarmas} />
      <div className="flex min-h-0 flex-1">
        <NavegadorPc compacto={compacto} />
        <main className="min-w-0 flex-1 overflow-auto p-3">{contenido}</main>
      </div>
      <BandaAlarmas alarmas={alarmas} />
      <BarraEstado />
      <NavegadorCelular sinVer={alarmas.sinVer.length} />
    </div>
  )
}
