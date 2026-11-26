import { useEffect, useRef, useState } from 'react'
import { Panel } from '../components/Panel'
import { Button } from '../components/ui/button'
import MarcaAlarma from '../components/MarcaAlarma'
import MarcaSinDatos from '../components/MarcaSinDatos'
import ReplicaBadge from '../components/ReplicaBadge'
import { textoCopia, useEstadoBarra } from '../components/marco/useEstadoBarra'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'
import { Filtros, SinDatos, type Rango } from '../components/Filtros'
import { useDatos, hoy } from '../lib/useDatos'
import { useCamarasStore } from '../store/camaras'
import { hhmm, txt, fechaHora } from '../lib/camaras'
import { apiJson } from '../lib/api'
import { estaVencido } from '../lib/estadoGrupo'
import { useNow } from '../lib/useNow'
import { filasSistema, textoCortes, type Resumen, type Color } from '../lib/sistema'

function Detalle() {
  const { poller, mapa, conectado, ts, estado, recibidoEn } = useCamarasStore()
  const ahoraMs = useNow(1000)
  const vencido = !estado || estaVencido(recibidoEn, ahoraMs)
  const [r, setR] = useState<Rango>({ desde: hoy(-1), hasta: hoy(), camara: '' })
  const { data, error, cargando } = useDatos<Record<string, any>>('comunicacion', r.desde, r.hasta)
  const cols = data && data.length ? Object.keys(data[0]) : []
  const fmt = (k: string, v: any) => (k === 'ts' || k === 'time' ? fechaHora(v) : String(v ?? ''))
  const dato = (t: string, v: string) => <div><div className="text-xs text-texto-2">{t}</div><div className="font-medium">{v}</div></div>
  return (
    <div className="space-y-3">
      <Panel titulo="Comunicación con el PLC"><div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
        {dato('Poller', poller ?? 'sin dato')}
        {dato('PLC', vencido ? 'sin datos' : conectado ? 'comunicando' : 'sin comunicación')}
        {dato('Última lectura', ts ? hhmm(ts) : '—')}
        {dato('Mapa', mapa === 'incompatible' ? 'incompatible' : mapa === 'ok' ? 'ok' : '—')}
        {dato('Hora del PLC', vencido ? '—' : txt(estado, 'hora_plc') || '—')}
      </div></Panel>
      <Filtros r={r} set={setR} sinCamara />
      <Panel titulo="Historial de comunicación (cortes, lecturas descartadas, desvío del reloj)">
        {cargando && !data ? <div className="text-center text-sm text-texto-2 py-8">Cargando...</div> : <>
          <SinDatos error={error} vacio={!!data && data.length === 0} />
          {data && data.length > 0 && (
            <Table>
              <TableHeader><TableRow>{cols.map(c => <TableHead key={c}>{c}</TableHead>)}</TableRow></TableHeader>
              <TableBody>{data.map((f, i) => <TableRow key={i}>{cols.map(c => <TableCell key={c} className={typeof f[c] === 'number' || c === 'ts' || c === 'time' ? 'font-mono' : undefined}>{fmt(c, f[c])}</TableCell>)}</TableRow>)}</TableBody>
            </Table>
          )}
        </>}
      </Panel>
    </div>
  )
}

// Marca de cada fila: alarma si algo está mal, "?" si falta el dato, nada si está bien
const Marca = ({ color, texto }: { color: Color; texto: string }) =>
  color === 'rojo' ? <MarcaAlarma /> : texto === 'sin datos' ? <MarcaSinDatos /> : <span className="h-[16px] w-[16px] shrink-0" />

// Celular: la barra de estado no se ve, así que PLC, servidor, última copia y versión van acá
function EstadoApp() {
  const { plc, servidor, replica, footer, copias } = useEstadoBarra()
  const fila = (t: string, v: React.ReactNode) => <div className="flex items-center gap-3 border-b border-linea-fila px-2 py-2 text-sm last:border-0"><span className="flex-1">{t}</span><span className="text-right font-medium">{v}</span></div>
  return (
    <div className="md:hidden"><Panel titulo="Esta aplicación" className="[&>div]:p-0">
      {fila('PLC', plc ? 'conectado' : 'desconectado')}
      {fila(replica ? 'Réplica' : 'Servidor', replica ? <ReplicaBadge /> : servidor ? 'conectado' : 'reconectando')}
      {copias && fila('Última copia: esta PC', <span className="font-mono">{textoCopia(copias.estado.local)}</span>)}
      {copias?.drive.activo && fila('Última copia: Drive', <span className="font-mono">{textoCopia(copias.estado.drive)}</span>)}
      {fila('Versión', <span className="font-mono">v{__APP_VERSION__}</span>)}
      {footer && fila('Powered by', footer)}
    </Panel></div>
  )
}

export default function Sistema() {
  const [res, setRes] = useState<Resumen | null>(null)
  const [ahora, setAhora] = useState(Date.now())
  const vuelo = useRef(false)
  const fallos = useRef(0)
  const [det, setDet] = useState(false)
  useEffect(() => {
    let vivo = true
    const cargar = () => {
      if (vuelo.current) return
      vuelo.current = true
      apiJson<Resumen>('/sistema/resumen')
        .then(d => { if (vivo) { fallos.current = 0; setRes(d); setAhora(Date.now()) } })
        .catch(() => { if (vivo && ++fallos.current >= 3) setRes(null) })
        .finally(() => { vuelo.current = false })
    }
    cargar()
    const id = setInterval(cargar, 30000)
    return () => { vivo = false; clearInterval(id) }
  }, [])
  return (
    <div className="space-y-3 max-w-md md:max-w-none">
      <EstadoApp />
      <Panel titulo="Estado" className="[&>div]:p-0">
        {filasSistema(res, ahora).map(f => (
          <div key={f.titulo} className="flex items-center gap-3 border-b border-linea-fila px-2 py-2 text-sm last:border-0">
            <Marca color={f.color} texto={f.texto} />
            <span className="flex-1">{f.titulo}</span>
            <span className="text-right font-medium">{f.texto}</span>
          </div>
        ))}
      </Panel>
      <p className="text-sm">{textoCortes(res?.cortes7d)}</p>
      <Button variant="ghost" size="compacto" onClick={() => setDet(d => !d)}>{det ? 'Ocultar detalle técnico' : 'Ver detalle técnico'}</Button>
      {det && <Detalle />}
    </div>
  )
}
