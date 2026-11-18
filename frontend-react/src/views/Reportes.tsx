import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Switch } from '../components/ui/switch'
import { Panel } from '../components/Panel'
import { apiBlob, apiJson } from '../lib/api'
import { useDatos } from '../lib/useDatos'
import { resumenAyer } from '../lib/sistema'
import { fechaDia, ayerPlanta } from '../lib/camaras'
import { useAuthStore } from '../store/auth'

const n = (v: number | null, u = '') => (v == null ? 'sin datos' : `${v}${u}`)

type Canales = { correo: boolean; telegram: boolean }
type Info = { time: string; canales: Canales; semanal: boolean; mensual: boolean; telegramConfigurado: boolean; enabled: boolean }
type Tipo = 'dia' | 'semana' | 'mes'
const NOMBRE: Record<Tipo, string> = { dia: 'de ayer', semana: 'semanal (última semana completa)', mes: 'mensual (último mes completo)' }
type ResultadoEnvio = { tipo?: Tipo; correo: string; telegram: string; historyError?: boolean }

// Resultado de un canal en palabras ('ok' | 'error: …' | 'no configurado' | 'apagado')
const resultado = (r: string) => (r === 'ok' ? 'enviado' : r === 'apagado' ? 'apagado' : r === 'no configurado' ? 'no está configurado' : `no se pudo (${r.replace(/^error: /, '')})`)

function Envio({ admin }: { admin: boolean }) {
  const [info, setInfo] = useState<Info | null>(null)
  const [err, setErr] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [envio, setEnvio] = useState<ResultadoEnvio | null>(null)

  useEffect(() => { if (admin) apiJson<Info>('/settings/daily-report').then(setInfo).catch(e => setErr(e.message)) }, [admin])

  async function guardar(cambio: object) {
    setGuardando(true); setErr('')
    try { setInfo(await apiJson<Info>('/settings/daily-report', { method: 'POST', body: JSON.stringify(cambio) })) }
    catch (e) { setErr(e instanceof Error ? e.message : 'No se pudo guardar') }
    finally { setGuardando(false) }
  }
  const cambiar = (canal: keyof Canales, valor: boolean) => guardar({ canales: { [canal]: valor } })

  async function mandar(tipo: Tipo) {
    setEnviando(true); setErr(''); setEnvio(null)
    try { setEnvio(await apiJson<ResultadoEnvio>('/settings/daily-report/enviar', { method: 'POST', body: JSON.stringify({ tipo }) })) }
    catch (e) { setErr(e instanceof Error ? e.message : 'No se pudo mandar') }
    finally { setEnviando(false) }
  }

  if (!admin) return <p className="text-sm text-texto-2">El reporte sale solo todos los días.</p>
  if (!info) return err ? <p className="text-sm text-estado-alta">{err}</p> : null
  return (
    <Panel titulo="Envío automático"><div className="space-y-2 text-sm">
      <p className="text-texto-2">
        {info.enabled ? `Sale todos los días a las ${info.time} con el PDF del día anterior.` : 'El envío automático está apagado en el servidor.'}{' '}
        La hora se cambia en <Link to="/config" className="underline">Configuración avanzada</Link>.
      </p>
      <label className="toque flex items-center justify-between gap-3">
        <span>Mandar por correo</span>
        <Switch checked={info.canales.correo} disabled={guardando} onCheckedChange={(v) => cambiar('correo', v)} />
      </label>
      <label className="toque flex items-center justify-between gap-3">
        <span>
          Mandar por Telegram
          {!info.telegramConfigurado && <span className="block text-xs text-texto-2">Configurá Telegram en <Link to="/config?tab=telegram" className="underline">Configuración avanzada</Link></span>}
        </span>
        <Switch checked={info.telegramConfigurado && info.canales.telegram} disabled={guardando || !info.telegramConfigurado} onCheckedChange={(v) => cambiar('telegram', v)} />
      </label>
      <label className="toque flex items-center justify-between gap-3">
        <span>Reporte semanal<span className="block text-xs text-texto-2">Los lunes, de lunes a domingo, con la comparación con la semana anterior</span></span>
        <Switch checked={info.semanal} disabled={guardando} onCheckedChange={(v) => guardar({ semanal: v })} />
      </label>
      <label className="toque flex items-center justify-between gap-3">
        <span>Reporte mensual<span className="block text-xs text-texto-2">El día 1, con el mes anterior completo</span></span>
        <Switch checked={info.mensual} disabled={guardando} onCheckedChange={(v) => guardar({ mensual: v })} />
      </label>
      <div className="space-y-2 pt-1">
        {(['dia', 'semana', 'mes'] as Tipo[]).map(t => (
          <Button key={t} variant="outline" className="w-full" onClick={() => mandar(t)} disabled={enviando}>{enviando ? 'Mandando…' : `Mandar el reporte ${NOMBRE[t]} ahora`}</Button>
        ))}
      </div>
      {envio && (
        <div>
          {envio.historyError && <div className="text-estado-alta">No se pudo leer el historial: salió solo el aviso, sin PDF.</div>}
          <div>Correo: {resultado(envio.correo)}</div>
          <div>Telegram: {resultado(envio.telegram)}</div>
        </div>
      )}
      {err && <p className="text-estado-alta">{err}</p>}
    </div></Panel>
  )
}

export default function Reportes() {
  const dia = ayerPlanta()
  const admin = useAuthStore(s => s.isAdmin())
  const [fecha, setFecha] = useState(dia)
  const [tipo, setTipo] = useState<Tipo>('dia')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const desc = useDatos<any>('descongelados', dia, dia)
  const ev = useDatos<any>('eventos', dia, dia)
  const comp = useDatos<any>('compresores', dia, dia)
  const r = useMemo(() => resumenAyer(desc.data, ev.data, comp.data), [desc.data, ev.data, comp.data])

  async function descargar() {
    setBusy(true); setErr('')
    try {
      const q = encodeURIComponent(fecha)
      const blob = await apiBlob(tipo === 'dia' ? `/reportes/diario.pdf?fecha=${q}` : `/reportes/periodo.pdf?tipo=${tipo}&fecha=${q}`)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = tipo === 'dia' ? `reporte-camaras_${fecha}.pdf` : tipo === 'semana' ? `reporte-semanal_${fecha}.pdf` : `reporte-mensual_${fecha.slice(0, 7)}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al descargar')
    } finally { setBusy(false) }
  }

  return (
    <div className="space-y-3 max-w-md">
      <Panel titulo={`Ayer, ${fechaDia(Date.parse(`${dia}T12:00:00-03:00`))}`}>
        <div className="space-y-1 text-sm">
          <div>Descongelados: <span className="font-mono">{n(r.descongelados)}</span>{r.saltados ? <> (<span className="font-mono">{r.saltados}</span> se saltaron)</> : ''}</div>
          <div>Alarmas: <span className="font-mono">{n(r.avisos)}</span> (sin contar acciones de operarios)</div>
          <div>Horas de compresores: <span className="font-mono">{n(r.horas, ' h')}</span></div>
        </div>
      </Panel>
      <div className="flex flex-wrap items-center gap-2">
        <select aria-label="Tipo de reporte" value={tipo} onChange={(e) => setTipo(e.target.value as Tipo)} className="toque border border-borde-campo bg-placa px-2 text-sm">
          <option value="dia">Diario</option><option value="semana">Semanal</option><option value="mes">Mensual</option>
        </select>
        <input type="date" aria-label={tipo === 'dia' ? 'Día del reporte' : tipo === 'semana' ? 'Un día de la semana' : 'Un día del mes'} title={tipo === 'dia' ? undefined : `Cualquier día ${tipo === 'semana' ? 'de la semana' : 'del mes'} que querés`} value={fecha} max={dia} min="2000-01-01" onChange={(e) => setFecha(e.target.value)}
          className="toque border border-borde-campo bg-placa px-2 text-sm" />
        <Button className="flex-1" onClick={descargar} disabled={busy || !fecha}>{busy ? 'Generando…' : 'Descargar PDF'}</Button>
      </div>
      {err && <p className="text-sm text-estado-alta">{err}</p>}
      <Envio admin={admin} />
    </div>
  )
}
