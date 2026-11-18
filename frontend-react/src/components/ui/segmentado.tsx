import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export interface ItemSegmentado { id: string; label: string; to?: string; marca?: boolean }

export const chipCls = (on: boolean) =>
  cn('toque inline-flex h-[30px] items-center whitespace-nowrap rounded-full border px-3 text-sm', on ? 'border-accion bg-accion text-accion-texto' : 'border-linea-boton bg-panel')

interface Props {
  items: ItemSegmentado[]
  activo: string
  onCambio?: (id: string) => void
  grande?: boolean
  'aria-label': string
}

export function Segmentado({ items, activo, onCambio, grande, 'aria-label': etiqueta }: Props) {
  return (
    <div role="tablist" aria-label={etiqueta} className="inline-flex items-center gap-1 rounded-[12px] bg-fila-total p-1">
      {items.map(it => {
        const on = it.id === activo
        const cls = cn(
          'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3',
          grande ? 'h-[40px] text-lg' : 'h-[30px] text-sm',
          on ? 'bg-panel font-semibold shadow-tarjeta' : 'text-texto-2'
        )
        const contenido = <>{it.label}{it.marca && <span aria-label="con alarma" className="h-2 w-2 rounded-full bg-estado-alta" />}</>
        return it.to
          ? <Link key={it.id} to={it.to} className={cls} aria-current={on ? 'page' : undefined}>{contenido}</Link>
          : <button key={it.id} type="button" role="tab" aria-selected={on} className={cls} onClick={() => onCambio?.(it.id)}>{contenido}</button>
      })}
    </div>
  )
}
