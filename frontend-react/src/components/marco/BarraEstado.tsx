import ReplicaBadge from '../ReplicaBadge'
import { textoCopia, useEstadoBarra } from './useEstadoBarra'

// Barra de estado (solo computadora), 22 px: PLC, servidor, última copia (solo admin) y versión.
export default function BarraEstado() {
  const { plc, servidor, replica, footer, copias } = useEstadoBarra()
  return (
    <footer className="hidden items-center gap-5 md:flex overflow-hidden whitespace-nowrap bg-marco px-3 text-xs text-marco-texto-2">
      <span>PLC <b className="font-medium text-marco-texto">{plc ? 'conectado' : 'desconectado'}</b></span>
      {replica ? <ReplicaBadge /> : <span>Servidor <b className="font-medium text-marco-texto">{servidor ? 'conectado' : 'reconectando'}</b></span>}
      {copias && <span>Última copia: esta PC <b className="font-medium text-marco-texto">{textoCopia(copias.estado.local)}</b>
        {copias.drive.activo && <> · Drive <b className="font-medium text-marco-texto">{textoCopia(copias.estado.drive)}</b></>}</span>}
      <span className="ml-auto">{footer && <>Powered By <b className="font-medium text-marco-texto">{footer}</b> · </>}v{__APP_VERSION__}</span>
    </footer>
  )
}
