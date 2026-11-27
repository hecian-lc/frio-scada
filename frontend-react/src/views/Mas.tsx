import { Link, useNavigate } from 'react-router-dom'
import { marcarTutorial } from '../lib/tutorial'
import { useAuthStore } from '../store/auth'
import { ChevronRight } from 'lucide-react'
import { Panel } from '../components/Panel'
import { Button } from '../components/ui/button'
import { FirmaHecian } from '../components/FirmaHecian'
import { useBrandingStore } from '../store/branding'

const ITEMS = [
  { to: '/reportes', label: 'Reportes (diario, semanal y mensual)', admin: false },
  { to: '/avisos', label: 'Avisos por Telegram y mail', admin: false },
  { to: '/programacion', label: 'Programación de descongelados', admin: true },
  { to: '/usuarios', label: 'Usuarios', admin: true },
  { to: '/sistema', label: 'Estado del sistema', admin: false },
  { to: '/config', label: 'Configuración avanzada', admin: true },
]

export default function Mas() {
  const isAdmin = useAuthStore(s => s.isAdmin())
  const user = useAuthStore(s => s.user)
  const navigate = useNavigate()
  const footer = useBrandingStore(s => s.footer)
  return (
    <div className="max-w-xl space-y-3">
      <Panel titulo="Más opciones" className="[&>div]:p-0">
        <ul className="divide-y divide-linea-fila">
          {ITEMS.filter(i => !i.admin || isAdmin).map(i => (
            <li key={i.to}>
              <Link to={i.to} className="toque flex items-center justify-between px-2 py-3 text-base hover:bg-seleccion">
                {i.label}<ChevronRight className="h-5 w-5 text-texto-2" />
              </Link>
            </li>
          ))}
        </ul>
      </Panel>
      <Button variant="secondary" onClick={() => { marcarTutorial('inicio', user, false); marcarTutorial('camara', user, false); navigate('/') }}>Ver el tutorial de nuevo</Button>
      {/* Acerca de (marca HECIAN LC v0.2.0, plantillas/ESTANDAR.md) */}
      <Panel titulo="Acerca de">
        <div id="acerca-de" className="space-y-3 text-sm">
          <div>
            <div className="font-titulo text-lg font-semibold">Frío SCADA</div>
            <div className="text-texto-2">Versión <span className="font-mono">v{__APP_VERSION__}</span></div>
          </div>
          <FirmaHecian ancho={160} />
          <p>© 2026 HECIAN LC. Todos los derechos reservados. Software propietario.</p>
          {footer && <p>Powered by <b className="font-medium">{footer}</b></p>}
          <p className="text-texto-2">Este producto usa componentes de código abierto que se rigen por sus propias licencias.</p>
        </div>
      </Panel>
    </div>
  )
}
