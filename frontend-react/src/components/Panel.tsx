import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PanelProps {
  titulo: string
  accion?: ReactNode
  grande?: boolean
  className?: string
  children?: ReactNode
  'data-tour'?: string
}

export function Panel({ titulo, accion, grande, className, children, ...rest }: PanelProps) {
  return (
    <section className={cn('rounded-lg border border-linea bg-panel p-[18px] shadow-tarjeta', className)} data-tour={rest['data-tour']}>
      <header className="mb-3 flex items-center justify-between gap-2">
        <h2 className={cn('truncate font-bold', grande ? 'text-lg' : 'text-base')}>{titulo}</h2>
        {accion && <div className="flex items-center gap-1">{accion}</div>}
      </header>
      <div>{children}</div>
    </section>
  )
}
