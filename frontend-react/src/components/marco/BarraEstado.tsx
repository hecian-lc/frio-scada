import { useState } from 'react'
import ReplicaBadge from '../ReplicaBadge'
import { estadoConexion, mostrarAviso } from '../../lib/conexion'
import { useNow } from '../../lib/useNow'
import { useCamarasStore } from '../../store/camaras'
import { textoCopia, useEstadoBarra } from './useEstadoBarra'
import { FirmaPie } from '../FirmaHecian'

const Punto = ({ ok }: { ok: boolean }) => <span aria-hidden="true" className={`mr-1.5 inline-block h-[8px] w-[8px] rounded-full ${ok ? 'bg-ok-texto' : 'bg-texto-2'}`} />

// Barra de estado (solo computadora), 36 px: PLC, servidor, última copia (solo admin), Powered by del cliente, firma
// HECIAN LC (marca v0.2.0) y versión. En el celular la firma va al pie del contenido (App.tsx).
export default function BarraEstado() {
  const [montadoEn] = useState(Date.now)
  const ahora = useNow(1000)
  const { tipo } = estadoConexion(useCamarasStore(s => s.recibidoEn), ahora)
  const plc = tipo === 'ok' || tipo === 'demora' ? 'conectado' : tipo === 'nunca' && !mostrarAviso(tipo, montadoEn, ahora) ? 'conectando…' : 'sin conexión'
  const { servidor, replica, footer, copias } = useEstadoBarra()
  return (
    <footer className="hidden h-[36px] shrink-0 items-center gap-5 overflow-hidden whitespace-nowrap border-t border-linea bg-panel px-8 text-sm text-texto-2 md:flex">
      <span className="inline-flex items-center"><Punto ok={plc === 'conectado'} />PLC <b className="ml-1 font-medium text-texto">{plc}</b></span>
      {replica ? <ReplicaBadge /> : <span className="inline-flex items-center"><Punto ok={servidor} />Servidor <b className="ml-1 font-medium text-texto">{servidor ? 'conectado' : 'reconectando'}</b></span>}
      {copias && <span>Última copia: esta PC <b className="font-medium text-texto">{textoCopia(copias.estado.local)}</b>
        {copias.drive.activo && <> · Drive <b className="font-medium text-texto">{textoCopia(copias.estado.drive)}</b></>}</span>}
      <span className="ml-auto inline-flex items-center">{footer && <>Powered By&nbsp;<b className="font-medium text-texto">{footer}</b>&nbsp;·&nbsp;</>}<FirmaPie className="text-sm" />&nbsp;·&nbsp;v{__APP_VERSION__}</span>
    </footer>
  )
}
