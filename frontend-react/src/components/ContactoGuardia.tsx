import { MessageCircle, Phone } from 'lucide-react'
import { cn } from '../lib/utils'
import { telHref, useGuardia, waHref } from '../lib/guardia'

// A quién llamar ahora: la persona de guardia del turno en curso (nada si no hay nadie)
export default function ContactoGuardia({ compacto }: { compacto?: boolean }) {
  const { actual } = useGuardia()
  if (!actual) return null
  const cls = cn('inline-flex shrink-0 items-center gap-1 whitespace-nowrap border border-borde-campo bg-placa px-2 text-sm font-semibold text-accion hover:bg-seleccion',
    compacto ? 'h-[24px]' : 'min-h-[44px] md:min-h-[32px]')
  return (
    <span className="inline-flex shrink-0 flex-wrap items-center gap-2">
      <a href={telHref(actual.telefono)} className={cls}><Phone aria-hidden="true" className="h-[14px] w-[14px]" />Llamar a {actual.nombre}</a>
      {actual.whatsapp && !compacto && <a href={waHref(actual.telefono)} target="_blank" rel="noreferrer" className={cls}><MessageCircle aria-hidden="true" className="h-[14px] w-[14px]" />WhatsApp</a>}
    </span>
  )
}
