import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PanelProps {
  titulo: string
  accion?: ReactNode
  className?: string
  children?: ReactNode
  'data-tour'?: string
}

export function Panel({ titulo, accion, className, children, ...rest }: PanelProps) {
  return (
    <section className={cn('border border-linea bg-panel', className)} data-tour={rest['data-tour']}>
      <header className="flex h-7 items-center justify-between gap-2 bg-panel-titulo px-2 font-cond text-xs font-semibold uppercase tracking-wide text-panel-titulo-texto">
        <h2 className="truncate">{titulo}</h2>
        {accion && <div className="flex items-center gap-1">{accion}</div>}
      </header>
      <div className="p-2">{children}</div>
    </section>
  )
}
