import { cn } from '../lib/utils'
import { instruccion, useGuardia } from '../lib/guardia'
import ContactoGuardia from './ContactoGuardia'

// "Qué hacer:" con la instrucción del admin (o la frase de fábrica) y el contacto de guardia.
// soloTexto: sin el contacto (la tarjeta del celular lo pone al lado de Visto); sin instrucción no muestra nada.
export default function QueHacer({ clave, soloTexto, className }: { clave: string; soloTexto?: boolean; className?: string }) {
  const texto = instruccion(clave, useGuardia().instrucciones)
  if (soloTexto) return texto ? <p className={cn('whitespace-pre-line text-texto', className)}><b className="font-semibold">Qué hacer:</b> {texto}</p> : null
  return (
    <div className={cn('flex flex-wrap items-center gap-2 text-texto', className)}>
      {texto && <p className="whitespace-pre-line"><b className="font-semibold">Qué hacer:</b> {texto}</p>}
      <ContactoGuardia />
    </div>
  )
}
