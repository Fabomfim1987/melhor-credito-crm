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
  const parceirosRaw = vals.filter(Boolean).map(v => JSON.parse(v!))

  // Determinar slots disponíveis
  const todosSlots = new Set<string>()
  parceirosRaw.forEach(p => { if (p.historico_mensal) Object.keys(p.historico_mensal).forEach(k => todosSlots.add(k)) })
  const slotsOrdenados = Array.from(todosSlots).sort((a,b) => {
    const [ma,ya]=a.split('/').map(Number); const [mb,yb]=b.split('/').map(Number)
    return (ya*100+ma)-(yb*100+mb)
  })

  // Pegar os 4 últimos meses cronologicamente
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

  // Dias úteis por mês 2026 (referência)
  const DU_MES: Record<string,number> = {
    '01/2026':21,'02/2026':19,'03/2026':21,'04/2026':20,'05/2026':20,
    '06/2026':19,'07/2026':23,'08/2026':21,'09/2026':22,'10/2026':22,
    '11/2026':19,'12/2026':22,
  }

  // Calcular du_decorridos para o mês atual (se for mês corrente)
  const hoje = new Date()
  const mesCorrente = `${String(hoje.getMonth()+1).padStart(2,'0')}/${hoje.getFullYear()}`
  function duDecorridos(): number {
    let count = 0
    for (let d = 1; d <= hoje.getDate(); d++) {
      const dt = new Date(hoje.getFullYear(), hoje.getMonth(), d)
      const dow = dt.getDay()
      if (dow !== 0 && dow !== 6) count++
    }
    return count || 1
  }

  // Enriquecer cada parceiro
  const parceiros = parceirosRaw.map(p => {
    const md = ultimos4.map(slot => ({ mes:slot, prod:p.historico_mensal?.[slot]?.prod||0, dig:p.historico_mensal?.[slot]?.dig||0 }))
    const mesAtualSlot = ultimos4[3]
    const prodAtual = md[3]?.prod || 0
    const digAtual = md[3]?.dig || 0

    // Projeção: se mês atual é o corrente, projeta; senão, é o realizado
    let projProd = prodAtual
    let projDig = digAtual
    if (mesAtualSlot === mesCorrente) {
      const duTotal = DU_MES[mesAtualSlot] || 20
      const duDec = duDecorridos()
      const fator = duTotal / duDec
      projProd = prodAtual * fator
      projDig = digAtual * fator
    }

    // Potencial: maior valor entre pico_2025 e os 4 meses recentes
    const potencial = Math.max(
      p.pico_2025 || 0,
      ...md.map(m => m.prod || 0)
    )

    // Gap = potencial - mês atual (quanto falta para voltar ao pico)
    const gapProd = potencial - prodAtual

    return {
      ...p,
      meses_display: md,
      ultimo_dia: p.ultimo_dia || null,
      proj_prod: projProd,
      proj_dig: projDig,
      potencial,
      gap_prod: gapProd,
    }
  })

  // Ordenar por potencial (maior primeiro)
  parceiros.sort((a,b) => (b.potencial||0) - (a.potencial||0))

  return NextResponse.json(parceiros)
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
