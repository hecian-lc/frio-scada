import { instruccion, useGuardia } from '../lib/guardia'
import ContactoGuardia from './ContactoGuardia'

// "Qué hacer:" con la instrucción del admin (o la frase de fábrica) y el contacto de guardia.
// compacto: una sola línea para la banda de 32 px; el texto se recorta y "Llamar a" queda entero.
export default function QueHacer({ clave, compacto }: { clave: string; compacto?: boolean }) {
  const texto = instruccion(clave, useGuardia().instrucciones)
  if (compacto) return (
    <span className="flex min-w-0 flex-1 items-center gap-2">
      {texto && <span className="min-w-0 truncate text-texto" title={texto}><b className="font-semibold">Qué hacer:</b> {texto}</span>}
      <ContactoGuardia compacto />
    </span>
  )
  return (
    <div className="flex flex-wrap items-center gap-2 text-texto">
      {texto && <p className="whitespace-pre-line"><b className="font-semibold">Qué hacer:</b> {texto}</p>}
      <ContactoGuardia />
    </div>
  )
}
