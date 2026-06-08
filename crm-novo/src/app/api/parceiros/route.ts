import { NextRequest, NextResponse } from 'next/server'
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL!)

export async function GET(req: NextRequest) {
  const action = new URL(req.url).searchParams.get('action')

  if (action === 'flush') {
    const keys = await redis.keys('parceiro:*')
    if (keys.length > 0) await redis.del(...keys)
    return NextResponse.json({ ok: true, deleted: keys.length })
  }

  const keys = await redis.keys('parceiro:*')
  if (keys.length === 0) return NextResponse.json([])

  const vals = await redis.mget(...keys)
  const parceiros = vals.filter(Boolean).map(v => JSON.parse(v!)).sort((a,b) => b.proj_prod - a.proj_prod)

  // Mostrar sempre os 3 meses cronologicamente mais recentes que existem nos dados
  const todosSlots = new Set<string>()
  parceiros.forEach(p => { if (p.historico_mensal) Object.keys(p.historico_mensal).forEach(k => todosSlots.add(k)) })
  const slotsOrdenados = Array.from(todosSlots).sort((a,b) => {
    const [ma,ya]=a.split('/').map(Number); const [mb,yb]=b.split('/').map(Number)
    return (ya*100+ma)-(yb*100+mb)
  })

  // Pegar o MAIOR mês cronológico e voltar 4 meses a partir dele
  const maiorSlot = slotsOrdenados[slotsOrdenados.length-1]
  let ultimos4: string[] = []
  if (maiorSlot) {
    const [m,y] = maiorSlot.split('/').map(Number)
    for (let i = 3; i >= 0; i--) {
      let nm = m - i, ny = y
      while (nm <= 0) { nm += 12; ny -= 1 }
      ultimos4.push(`${String(nm).padStart(2,'0')}/${ny}`)
    }
  }

  return NextResponse.json(parceiros.map(p => ({
    ...p,
    meses_display: ultimos4.map(slot => ({ mes:slot, prod:p.historico_mensal?.[slot]?.prod||0, dig:p.historico_mensal?.[slot]?.dig||0 })),
    ultimo_dia: p.ultimo_dia||null,
  })))
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()

  if (body.parceiros_bulk) {
    const mesRef: string = body.mes_ref
    // Blindagem: rejeitar upload sem mes_ref válido (evita slot "undefined")
    if (!mesRef || !/^\d{2}\/\d{4}$/.test(mesRef)) {
      return NextResponse.json({ error: 'mes_ref inválido ou ausente', recebido: mesRef }, { status: 400 })
    }
    for (const p of body.parceiros_bulk) {
      const key = `parceiro:${p.id}`
      const existing = await redis.get(key)
      const prev = existing ? JSON.parse(existing) : {}
      const historico = prev.historico_mensal || {}
      // Limpar qualquer slot inválido herdado (undefined, null, etc.)
      Object.keys(historico).forEach(k => { if (!/^\d{2}\/\d{4}$/.test(k)) delete historico[k] })
      historico[mesRef] = { prod: p.abr_prod||0, dig: p.abr_dig||0 }
      await redis.set(key, JSON.stringify({
        ...p,
        status: prev.status ?? null,
        observacoes: prev.observacoes ?? [],
        ultima_atualizacao: prev.ultima_atualizacao ?? null,
        historico_mensal: historico,
      }))
    }
    return NextResponse.json({ ok: true, count: body.parceiros_bulk.length, mes: mesRef })
  }

  if (body.id && body.status !== undefined) {
    const key = `parceiro:${body.id}`
    const raw = await redis.get(key)
    if (!raw) return NextResponse.json({ error:'not found' }, { status:404 })
    const p = JSON.parse(raw)
    p.status = body.status; p.ultima_atualizacao = new Date().toISOString()
    await redis.set(key, JSON.stringify(p))
    return NextResponse.json(p)
  }

  if (body.id && body.observacao) {
    const key = `parceiro:${body.id}`
    const raw = await redis.get(key)
    if (!raw) return NextResponse.json({ error:'not found' }, { status:404 })
    const p = JSON.parse(raw)
    if (!p.observacoes) p.observacoes = []
    p.observacoes.unshift({ id:`${Date.now()}-${Math.random().toString(36).slice(2)}`, autor:body.autor||'Fabricio', data:new Date().toISOString(), texto:body.observacao })
    p.ultima_atualizacao = new Date().toISOString()
    await redis.set(key, JSON.stringify(p))
    return NextResponse.json(p)
  }

  return NextResponse.json({ error:'invalid body' }, { status:400 })
}

export async function DELETE(req: NextRequest) {
  const body = await req.json()
  if (body.id && body.obs_id) {
    const key = `parceiro:${body.id}`
    const raw = await redis.get(key)
    if (!raw) return NextResponse.json({ error:'not found' }, { status:404 })
    const p = JSON.parse(raw)
    p.observacoes = (p.observacoes||[]).filter((o:any) => o.id !== body.obs_id)
    await redis.set(key, JSON.stringify(p))
    return NextResponse.json(p)
  }
  return NextResponse.json({ error:'invalid body' }, { status:400 })
}
