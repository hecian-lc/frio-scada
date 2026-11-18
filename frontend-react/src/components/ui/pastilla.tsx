import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const TONOS = {
  alta: 'bg-alta-suave text-alta-texto',
  ok: 'bg-ok-suave text-ok-texto',
  accion: 'bg-seleccion text-accion',
  neutro: 'bg-fila-total text-texto-2',
  aviso: 'bg-aviso-suave text-aviso-texto',
}

export function Pastilla({ tono, children, className }: { tono: keyof typeof TONOS; children: ReactNode; className?: string }) {
  return <span className={cn('inline-flex h-[24px] items-center rounded-full px-[10px] text-xs font-semibold', TONOS[tono], className)}>{children}</span>
}
