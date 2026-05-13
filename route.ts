import { NextRequest, NextResponse } from 'next/server'
import { SEED } from '@/data/seed'
import { Parceiro, StatusCRM, Observacao } from '@/types'

declare global { var __store: Map<string, Parceiro> | undefined }

// ── Redis ────────────────────────────────────────────────────────────────────
async function getRedis() {
  try {
    const url = process.env.REDIS_URL
    if (!url) return null
    const Redis = (await import('ioredis')).default
    const isTLS = url.includes('redislabs') || url.includes('upstash') || url.startsWith('rediss://')
    return new Redis(url, { tls: isTLS ? {} : undefined, maxRetriesPerRequest: 2, connectTimeout: 5000, lazyConnect: true })
  } catch { return null }
}

async function loadStore(): Promise<Map<string, Parceiro>> {
  const redis = await getRedis()
  if (redis) {
    try {
      await redis.connect()
      const raw = await redis.get('parceiros_store')
      await redis.disconnect()
      if (raw) return new Map(Object.entries(JSON.parse(raw) as Record<string, Parceiro>))
    } catch (e) { console.error('Redis load error:', e); try { await redis.disconnect() } catch {} }
  }
  if (!global.__store) {
    global.__store = new Map()
    SEED.forEach(p => global.__store!.set(p.id, { ...p }))
  }
  return global.__store
}

async function saveStore(store: Map<string, Parceiro>) {
  global.__store = store
  const redis = await getRedis()
  if (redis) {
    try {
      await redis.connect()
      await redis.set('parceiros_store', JSON.stringify(Object.fromEntries(store.entries())))
      await redis.disconnect()
    } catch (e) { console.error('Redis save error:', e); try { await redis.disconnect() } catch {} }
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

// Retorna chave do mês atual e dos 2 anteriores: ['03/2026','04/2026','05/2026']
function ultimos3Meses(): string[] {
  const hoje = new Date()
  const meses: string[] = []
  for (let i = 2; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
    const m = String(d.getMonth() + 1).padStart(2, '0')
    meses.push(`${m}/${d.getFullYear()}`)
  }
  return meses
}

// Monta colunas dos 3 meses a partir do histórico guardado
function montarMeses(meses: Record<string, { prod: number; dig: number }> | undefined) {
  const chaves = ultimos3Meses()
  return chaves.map(chave => ({
    mes: chave,
    prod: meses?.[chave]?.prod ?? 0,
    dig:  meses?.[chave]?.dig  ?? 0,
  }))
}

// ── GET ──────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const store = await loadStore()
  const { searchParams } = new URL(req.url)
  const prom   = searchParams.get('promotora')
  const loja   = searchParams.get('loja')
  const q      = searchParams.get('quadrante')
  const status = searchParams.get('status')

  let list = Array.from(store.values())
  if (prom)   list = list.filter(p => p.promotora === prom)
  if (loja)   list = list.filter(p => p.loja === loja)
  if (q)      list = list.filter(p => p.quadrante === q)
  if (status) list = list.filter(p => status === 'sem_status' ? !p.status : p.status === status)

  // Enriquecer com colunas dos 3 meses calculadas dinamicamente
  const enriched = list.map(p => ({
    ...p,
    meses_display: montarMeses(p.meses),
  }))

  return NextResponse.json(enriched.sort((a, b) => {
    // Ordenar pelo mês mais recente
    const ma = a.meses_display?.[2]?.prod ?? a.mar_prod ?? 0
    const mb = b.meses_display?.[2]?.prod ?? b.mar_prod ?? 0
    return mb - ma
  }))
}

// ── PATCH ─────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const store = await loadStore()
  const body = await req.json()
  const { id, status, observacao, autor, parceiros_bulk } = body

  // Bulk update vindo do bot
  if (parceiros_bulk) {
    const novos = parceiros_bulk as Parceiro[]
    novos.forEach(np => {
      const existing = store.get(np.id)

      // Preservar histórico existente e mesclar novo mês
      const mesesExistentes: Record<string, { prod: number; dig: number }> = existing?.meses ?? {}

      // Se o bot enviou mes_ref (ex: '05/2026'), salvar prod/dig do mês
      if (np.mes_ref) {
        mesesExistentes[np.mes_ref] = {
          prod: np.abr_prod ?? 0,   // abr_prod = prod acumulada do mês atual
          dig:  np.abr_dig  ?? 0,
        }
      }

      // Último dia
      const ultimo_dia = {
        prod: np.ultimo_dia_prod ?? 0,
        dig:  np.ultimo_dia_dig  ?? 0,
        data: np.ultimo_dia_data ?? new Date().toISOString().slice(0, 10),
      }

      store.set(np.id, {
        ...np,
        meses:              mesesExistentes,
        ultimo_dia,
        // Preservar dados CRM
        status:             existing?.status             ?? null,
        observacoes:        existing?.observacoes        ?? [],
        ultima_atualizacao: existing?.ultima_atualizacao ?? undefined,
        // Compatibilidade com campos legados
        mar_prod: mesesExistentes['03/2026']?.prod ?? np.mar_prod ?? 0,
        mar_dig:  mesesExistentes['03/2026']?.dig  ?? np.mar_dig  ?? 0,
      })
    })
    await saveStore(store)
    return NextResponse.json({ ok: true, count: novos.length })
  }

  // Atualização individual (status / observação)
  const p = store.get(id)
  if (!p) return NextResponse.json({ error: 'not found' }, { status: 404 })

  if (status !== undefined) {
    p.status = status as StatusCRM
    p.ultima_atualizacao = new Date().toISOString()
  }

  if (observacao?.trim()) {
    const o: Observacao = {
      id:    `obs-${Date.now()}`,
      texto: observacao.trim(),
      autor: autor || 'Equipe',
      data:  new Date().toISOString(),
    }
    p.observacoes = [o, ...(p.observacoes || [])]
    p.ultima_atualizacao = new Date().toISOString()
  }

  store.set(id, p)
  await saveStore(store)
  return NextResponse.json(p)
}

// ── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const store = await loadStore()
  const { id, obs_id } = await req.json()
  const p = store.get(id)
  if (!p) return NextResponse.json({ error: 'not found' }, { status: 404 })
  p.observacoes = p.observacoes.filter(o => o.id !== obs_id)
  store.set(id, p)
  await saveStore(store)
  return NextResponse.json(p)
}
