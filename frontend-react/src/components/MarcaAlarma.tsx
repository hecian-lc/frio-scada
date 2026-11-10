import { Icono } from './Icono'

// Cuadrado rojo con "!": la única marca de alarma/revisar
export default function MarcaAlarma({ size = 16 }: { size?: number }) {
  return <span aria-hidden className="inline-flex shrink-0 items-center justify-center bg-estado-alta text-estado-alta-sobre" style={{ width: size, height: size }}><Icono nombre="alarma" size={size - 4} /></span>
}
