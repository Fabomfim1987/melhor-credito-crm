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

  // ── RÉGUA DE QUADRANTES (recalculada no backend) ──────────────────────────
  // Baliza tudo contra a MELHOR marca histórica do parceiro.
  //   Produção: maior entre pico_2025 e os meses recentes (= potencial)
  //   Digitação: maior digitação entre os meses recentes (não há dig 2025 disponível)
  // Corte de 80%: estar >= 80% da melhor marca = "forte" naquele eixo.
  const CORTE = 0.80
  function classificarQuadrante(args:{
    projProd:number; potencial:number;
    digAtual:number; melhorDig:number;
    prodAtual:number; temHistorico:boolean;
  }):{ q:string; novo:boolean } {
    const { projProd, potencial, digAtual, melhorDig, prodAtual, temHistorico } = args

    // NOVO: sem nenhuma referência histórica (sem pico, sem dig passada) mas com movimento agora
    const semBaseProd = potencial <= 0
    const semBaseDig  = melhorDig <= 0
    if (semBaseProd && semBaseDig) {
      if (prodAtual > 0 || digAtual > 0) return { q:'Q5', novo:true } // novo na carteira
      return { q:'Q6', novo:false } // sem base e sem movimento = base morta
    }

    // Q1 — Alerta máximo: parou os dois eixos por completo
    if (prodAtual <= 0 && digAtual <= 0) return { q:'Q1', novo:false }

    // Eixos fortes? (>= 80% da melhor marca)
    const prodForte = potencial > 0 && (projProd / potencial) >= CORTE
    const digForte  = melhorDig > 0 && (digAtual / melhorDig) >= CORTE

    // Q5 — Saudável: os dois eixos no ritmo da melhor marca (ou um forte sem base no outro)
    if (prodForte && digForte) return { q:'Q5', novo:false }
    if (prodForte && semBaseDig) return { q:'Q5', novo:false }
    if (digForte && semBaseProd) return { q:'Q5', novo:false }

    // Q3 — Dig OK / Prod baixa: digitando bem, produção ainda não converteu
    if (digForte && !prodForte) return { q:'Q3', novo:false }

    // Q4 — Conversão residual: ainda produz (estoque), mas digitação caiu
    if (prodForte && !digForte) return { q:'Q4', novo:false }

    // Q2 — Alerta: os dois eixos caíram (abaixo de 80%) mas ainda há algum movimento
    return { q:'Q2', novo:false }
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

    // Melhor digitação histórica: maior digitação entre os meses recentes
    // (anteriores ao mês atual — para comparar o mês corrente contra o passado dele)
    const melhorDig = Math.max(
      0,
      ...md.slice(0, 3).map(m => m.dig || 0)
    )
    // Se não há digitação anterior, usar a maior de todos os meses como referência
    const melhorDigRef = melhorDig > 0 ? melhorDig : Math.max(0, ...md.map(m => m.dig || 0))

    // Gap = potencial - mês atual (quanto falta para voltar ao pico)
    const gapProd = potencial - prodAtual

    // Tem histórico real?
    const temHistorico = (p.pico_2025 || 0) > 0 || md.slice(0,3).some(m => (m.prod||0) > 0 || (m.dig||0) > 0)

    // Classificação dos quadrantes (régua nova, balizada contra a melhor marca)
    const { q, novo } = classificarQuadrante({
      projProd, potencial,
      digAtual, melhorDig: melhorDigRef,
      prodAtual, temHistorico,
    })

    return {
      ...p,
      meses_display: md,
      ultimo_dia: p.ultimo_dia || null,
      proj_prod: projProd,
      proj_dig: projDig,
      potencial,
      melhor_dig: melhorDigRef,
      gap_prod: gapProd,
      quadrante: q,        // SOBRESCREVE o quadrante gravado no upload (régua antiga)
      is_novo: novo,       // flag para "novo na carteira" (sem histórico)
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
    // Data de hoje no formato ISO (YYYY-MM-DD) — usado para snapshot diário
    const hojeISO = new Date().toISOString().slice(0,10)
    const hojeMesRef = `${String(new Date().getMonth()+1).padStart(2,'0')}/${new Date().getFullYear()}`

    for (const p of body.parceiros_bulk) {
      const key = `parceiro:${p.id}`
      const existing = await redis.get(key)
      const prev = existing ? JSON.parse(existing) : {}
      const historico = prev.historico_mensal || {}
      // Limpar qualquer slot inválido herdado (undefined, null, etc.)
      Object.keys(historico).forEach(k => { if (!/^\d{2}\/\d{4}$/.test(k)) delete historico[k] })
      historico[mesRef] = { prod: p.abr_prod||0, dig: p.abr_dig||0 }

      // Snapshot diário — só guardar se o upload é do mês corrente
      // Limpar entradas que não sejam do mês corrente (rolling: só mês atual)
      let historicoDiario = prev.historico_diario || {}
      Object.keys(historicoDiario).forEach(d => {
        if (!d.startsWith(hojeISO.slice(0,7))) delete historicoDiario[d]
      })
      if (mesRef === hojeMesRef) {
        historicoDiario[hojeISO] = { prod: p.abr_prod||0, dig: p.abr_dig||0 }
      }

      await redis.set(key, JSON.stringify({
        ...p,
        status: prev.status ?? null,
        observacoes: prev.observacoes ?? [],
        ultima_atualizacao: prev.ultima_atualizacao ?? null,
        historico_mensal: historico,
        historico_diario: historicoDiario,
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
