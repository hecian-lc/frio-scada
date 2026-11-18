import type { ReactNode } from 'react'
import { Pastilla } from './ui/pastilla'
import { useCamarasStore } from '../store/camaras'
import { estadoConexion, textoAlarmas } from '../lib/conexion'
import { resumenPlanta } from '../lib/resumen'
import { hhmm, type FilaDescongelado } from '../lib/camaras'
import { useNow } from '../lib/useNow'
import { cn } from '../lib/utils'

function Tarjeta({ etiqueta, cifra, de, detalle, alerta, cargando }: { etiqueta: string; cifra: ReactNode; de?: number; detalle: string; alerta?: boolean; cargando: boolean }) {
  return (
    <div className={cn('min-w-0 rounded-lg border bg-panel p-4 shadow-tarjeta', alerta ? 'border-alta-borde' : 'border-linea')}>
      <div className="text-sm text-texto-2">{etiqueta}</div>
      {cargando ? <><div className="mt-1 h-[34px] w-20 animate-pulse rounded-[10px] bg-fila-total" /><div className="mt-1 h-[18px] w-full animate-pulse rounded-[10px] bg-fila-total" /></> : <>
        <div className={cn('font-mono text-2xl font-bold tabular-nums', alerta && 'text-alta-texto')}>{cifra}{de !== undefined && <span className="text-[16px] font-normal text-texto-2"> / {de}</span>}</div>
        <div className="truncate text-sm text-texto-2" title={detalle}>{detalle}</div>
      </>}
    </div>
  )
}

export default function Indicadores({ filas }: { filas: FilaDescongelado[] | null }) {
  const estado = useCamarasStore(s => s.estado)
  const recibidoEn = useCamarasStore(s => s.recibidoEn)
  const ts = useCamarasStore(s => s.ts)
  const incompatible = useCamarasStore(s => s.mapa === 'incompatible')
  const ahora = useNow(1000)
  const tipo = estadoConexion(recibidoEn, ahora).tipo
  const cargando = tipo === 'nunca' || !estado || incompatible
  const atenuado = tipo === 'demora' || tipo === 'cortada'
  const r = estado && !incompatible ? resumenPlanta(estado, filas, ahora) : null
  return (
    <div data-tour="hoy">
      {atenuado && ts && <div className="mb-2"><Pastilla tono="neutro">Último dato {hhmm(ts)}</Pastilla></div>}
      <div className={cn('grid grid-cols-2 gap-3 lg:grid-cols-4', atenuado && 'opacity-[.55] grayscale-[.6]')}>
        <Tarjeta cargando={cargando} etiqueta="Compresores en marcha" cifra={r?.compresores.en} de={r?.compresores.de} detalle="Equipos andando ahora" />
        <Tarjeta cargando={cargando} etiqueta="Descongelados hoy" cifra={r?.descongelados.hechos ?? '—'} de={r?.descongelados.de} detalle={r ? `Próximo: ${r.proximo}` : ''} />
        <Tarjeta cargando={cargando} etiqueta="Alarmas activas" cifra={r?.alarmas} alerta={!!r && r.alarmas > 0} detalle={r ? textoAlarmas(r.alarmas) || 'Todo en orden' : ''} />
        <Tarjeta cargando={cargando} etiqueta="Equipos fuera de servicio" cifra={r?.fuera.n} detalle={r ? r.fuera.detalle || 'Ninguno' : ''} />
      </div>
    </div>
  )
}
