import ReplicaBadge from '../ReplicaBadge'
import { textoCopia, useEstadoBarra } from './useEstadoBarra'

const Punto = ({ ok }: { ok: boolean }) => <span aria-hidden="true" className={`mr-1.5 inline-block h-[8px] w-[8px] rounded-full ${ok ? 'bg-ok-texto' : 'bg-texto-2'}`} />

// Barra de estado (solo computadora), 36 px: PLC, servidor, última copia (solo admin) y versión.
export default function BarraEstado() {
  const { plc, servidor, replica, footer, copias } = useEstadoBarra()
  return (
    <footer className="hidden h-[36px] shrink-0 items-center gap-5 overflow-hidden whitespace-nowrap border-t border-linea bg-panel px-8 text-sm text-texto-2 md:flex">
      <span className="inline-flex items-center"><Punto ok={plc} />PLC <b className="ml-1 font-medium text-texto">{plc ? 'conectado' : 'desconectado'}</b></span>
      {replica ? <ReplicaBadge /> : <span className="inline-flex items-center"><Punto ok={servidor} />Servidor <b className="ml-1 font-medium text-texto">{servidor ? 'conectado' : 'reconectando'}</b></span>}
      {copias && <span>Última copia: esta PC <b className="font-medium text-texto">{textoCopia(copias.estado.local)}</b>
        {copias.drive.activo && <> · Drive <b className="font-medium text-texto">{textoCopia(copias.estado.drive)}</b></>}</span>}
      <span className="ml-auto">{footer && <>Powered By <b className="font-medium text-texto">{footer}</b> · </>}v{__APP_VERSION__}</span>
    </footer>
  )
}
