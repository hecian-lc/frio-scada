import { useEffect } from 'react'
import { Panel } from './Panel'
import { Button } from './ui/button'
import { useMando, usePermiso } from './Confirmar'
import { useCamarasStore } from '../store/camaras'
import { useAuthStore } from '../store/auth'

// El PLC arrancó con equipos en manual y espera una respuesta (ventana del arranque). Comando 7.
export default function AvisoArranque() {
  const pendiente = useCamarasStore(s => Number(s.estado?.arranque_con_manual_pendiente) === 1)
  const rol = useAuthStore(s => s.role)
  const permiso = usePermiso(7)
  const { pedir, enviando, dialogo, olvidarPregunta } = useMando()
  // La ventana se cerró: no dejar una pregunta vieja para el próximo arranque (el diálogo sigue montado para mostrar el resultado)
  useEffect(() => { if (!pendiente) olvidarPregunta() })
  if (!pendiente) return <>{dialogo}</>
  const mira = rol === 'operador' || rol === ''
  return (
    <div role="alert"><Panel titulo="El PLC arrancó con equipos en manual" className="border-accion">
      <div className="space-y-2">
      <div className="text-sm">Está esperando que elijas qué hacer con ellos.</div>
      {mira ? <div className="text-sm text-texto-2">Tu usuario solo puede mirar: la respuesta se da en el panel o con un usuario que pueda operar.</div> : <>
        <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
          <Button className="h-auto py-2 whitespace-normal" disabled={!permiso.ok || enviando} onClick={() => pedir({ comando: 7, valor: 1 })}>Mantener en manual</Button>
          <Button variant="outline" className="h-auto py-2 whitespace-normal" disabled={!permiso.ok || enviando} onClick={() => pedir({ comando: 7, valor: 2 })}>Pasar a automático</Button>
        </div>
        {!permiso.ok && <div className="text-sm text-texto-2">{permiso.motivo}</div>}
      </>}
      {dialogo}
      </div>
    </Panel></div>
  )
}
