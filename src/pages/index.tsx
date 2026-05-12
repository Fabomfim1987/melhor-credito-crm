import { useRouter } from 'next/router'
import Head from 'next/head'
import {
  parceiros,
  gestores,
  statusConfig,
  quadranteConfig,
  formatBRL,
  type Parceiro,
  type Status,
  type Quadrante,
} from '@/data/parceiros'

export default function Home() {
  const router = useRouter()
  const { loja } = router.query
  const salaAtiva = typeof loja === 'string' ? loja.toUpperCase() : null

  const gestor = gestores.find(g => g.key === salaAtiva)
  const parceirosFiltrados = salaAtiva
    ? parceiros.filter(p => p.sala === salaAtiva)
    : parceiros

  // KPIs por sala para o dashboard gerencial
  const kpisPorSala = gestores.map(g => {
    const lista = parceiros.filter(p => p.sala === g.key)
    const totalProd = lista.reduce((acc, p) => acc + p.producao, 0)
    const ativos = lista.filter(p => p.status === 'Ativo').length
    const alertas = lista.filter(p => p.quadrante === 'Q1' || p.quadrante === 'Q2').length
    return { ...g, totalProd, ativos, total: lista.length, alertas }
  })

  const totalGeral = parceiros.reduce((acc, p) => acc + p.producao, 0)
  const totalAtivos = parceiros.filter(p => p.status === 'Ativo').length
  const totalAlertas = parceiros.filter(p => p.quadrante === 'Q1' || p.quadrante === 'Q2').length

  return (
    <>
      <Head>
        <title>CRM — Melhor Crédito</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* TOPBAR */}
      <header style={{ background: '#07294a' }} className="px-6 py-3 flex items-center justify-between">
        <div>
          <span className="text-white font-bold text-base">Melhor Crédito</span>
          <span className="ml-3 text-xs uppercase tracking-widest" style={{ color: '#7cc8fb' }}>
            {salaAtiva ? `Sala — ${gestor?.nome ?? salaAtiva}` : 'Gerencial'}
          </span>
        </div>
        <nav className="flex gap-2">
          <button
            onClick={() => router.push('/')}
            className="text-xs px-3 py-1 rounded font-medium transition-all"
            style={{
              background: !salaAtiva ? '#2E75B6' : 'transparent',
              color: '#fff',
              border: '1px solid #2E75B6',
            }}
          >
            Gerencial
          </button>
          {gestores.map(g => (
            <button
              key={g.key}
              onClick={() => router.push(`/?loja=${g.key}`)}
              className="text-xs px-3 py-1 rounded font-medium transition-all"
              style={{
                background: salaAtiva === g.key ? g.cor : 'transparent',
                color: '#fff',
                border: `1px solid ${g.cor}`,
              }}
            >
              {g.key.charAt(0) + g.key.slice(1).toLowerCase()}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">

        {/* DASHBOARD GERENCIAL */}
        {!salaAtiva && (
          <>
            <h1 className="text-lg font-bold mb-1" style={{ color: '#07294a' }}>Dashboard Gerencial</h1>
            <p className="text-xs text-slate-500 mb-5">Visão consolidada das 3 salas · dados mockados</p>

            {/* KPIs gerais */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <KpiCard label="Produção Total" value={formatBRL(totalGeral)} cor="#07294a" />
              <KpiCard label="Parceiros Ativos" value={String(totalAtivos)} cor="#16a34a" />
              <KpiCard label="Em Alerta (Q1/Q2)" value={String(totalAlertas)} cor="#dc2626" />
            </div>

            {/* Cards por gestor */}
            <div className="grid grid-cols-3 gap-4">
              {kpisPorSala.map(g => (
                <div
                  key={g.key}
                  className="bg-white rounded-xl p-5 border border-slate-200 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/?loja=${g.key}`)}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: g.cor }} />
                    <span className="font-semibold text-sm" style={{ color: g.cor }}>{g.nome}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Produção</span>
                      <span className="font-bold" style={{ color: '#07294a' }}>{formatBRL(g.totalProd)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Parceiros</span>
                      <span className="font-medium">{g.ativos} ativos / {g.total} total</span>
                    </div>
                    {g.alertas > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Alertas</span>
                        <span className="font-medium text-red-600">{g.alertas} parceiro{g.alertas > 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                  <div
                    className="mt-4 text-xs text-center py-1 rounded font-medium"
                    style={{ background: g.cor + '18', color: g.cor }}
                  >
                    Ver sala →
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* VISÃO POR SALA */}
        {salaAtiva && gestor && (
          <>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h1 className="text-lg font-bold" style={{ color: gestor.cor }}>Sala — {gestor.nome}</h1>
                <p className="text-xs text-slate-500">{parceirosFiltrados.length} parceiros · dados mockados</p>
              </div>
              <div className="flex gap-4 text-sm">
                <span className="text-slate-500">Produção: <strong style={{ color: '#07294a' }}>{formatBRL(parceirosFiltrados.reduce((a, p) => a + p.producao, 0))}</strong></span>
                <span className="text-slate-500">Ativos: <strong className="text-green-700">{parceirosFiltrados.filter(p => p.status === 'Ativo').length}</strong></span>
                <span className="text-slate-500">Alertas: <strong className="text-red-600">{parceirosFiltrados.filter(p => p.quadrante === 'Q1' || p.quadrante === 'Q2').length}</strong></span>
              </div>
            </div>

            {/* Tabela de parceiros */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Parceiro</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Quadrante</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Produção</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Digitação</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Spread %</th>
                  </tr>
                </thead>
                <tbody>
                  {parceirosFiltrados
                    .sort((a, b) => b.producao - a.producao)
                    .map((p, i) => {
                      const st = statusConfig[p.status]
                      const qt = quadranteConfig[p.quadrante]
                      const isAlerta = p.quadrante === 'Q1' || p.quadrante === 'Q2'
                      return (
                        <tr
                          key={p.id}
                          style={{
                            background: isAlerta ? '#fffbeb' : i % 2 === 0 ? '#fff' : '#f8fafc',
                            borderBottom: '1px solid #f1f5f9',
                          }}
                        >
                          <td className="px-4 py-3 font-medium text-slate-800">{p.nome}</td>
                          <td className="px-4 py-3">
                            <BadgeStatus status={p.status} />
                          </td>
                          <td className="px-4 py-3">
                            <BadgeQuadrante quadrante={p.quadrante} />
                          </td>
                          <td className="px-4 py-3 text-right font-semibold" style={{ color: '#07294a' }}>
                            {p.producao > 0 ? formatBRL(p.producao) : '—'}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {p.digitacao > 0 ? p.digitacao : '—'}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {p.spread > 0 ? `${p.spread.toFixed(2)}%` : '—'}
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </>
  )
}

function KpiCard({ label, value, cor }: { label: string; value: string; cor: string }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ color: cor }}>{value}</p>
    </div>
  )
}

function BadgeStatus({ status }: { status: Status }) {
  const cfg = statusConfig[status]
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: cfg.bg, color: cfg.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
      {status}
    </span>
  )
}

function BadgeQuadrante({ quadrante }: { quadrante: Quadrante }) {
  const cfg = quadranteConfig[quadrante]
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.text }}
    >
      {quadrante} · {cfg.label}
    </span>
  )
}
