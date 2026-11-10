import { Icono } from './Icono'

// Cuadrado violeta con "?": la única marca de dato que falta
export default function MarcaSinDatos({ size = 16 }: { size?: number }) {
  return <span aria-hidden className="inline-flex shrink-0 items-center justify-center bg-estado-invalido text-estado-contorno" style={{ width: size, height: size }}><Icono nombre="sin-datos" size={size - 4} /></span>
}
