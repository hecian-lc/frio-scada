import { Link, useNavigate } from 'react-router-dom'
import { marcarTutorial } from '../lib/tutorial'
import { useAuthStore } from '../store/auth'
import { ChevronRight } from 'lucide-react'
import { Panel } from '../components/Panel'

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
      <button className="toque border border-borde-campo bg-placa px-4 text-sm font-medium hover:bg-seleccion" onClick={() => { marcarTutorial('inicio', user, false); marcarTutorial('camara', user, false); navigate('/') }}>Ver el tutorial de nuevo</button>
    </div>
  )
}
