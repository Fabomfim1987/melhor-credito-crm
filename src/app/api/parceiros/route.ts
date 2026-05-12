import { NextRequest, NextResponse } from 'next/server'
import { SEED } from '@/data/seed'
import { Parceiro, StatusCRM, Observacao } from '@/types'

declare global { var __store: Map<string,Parceiro>|undefined }

async function getRedis() {
  try {
    const url = process.env.REDIS_URL
    if (!url) return null
    const Redis = (await import('ioredis')).default
    const isTLS = url.includes('redislabs') || url.includes('upstash') || url.startsWith('rediss://')
    return new Redis(url, { tls: isTLS ? {} : undefined, maxRetriesPerRequest: 2, connectTimeout: 5000, lazyConnect: true })
  } catch { return null }
}

async function loadStore(): Promise<Map<string,Parceiro>> {
  const redis = await getRedis()
  if (redis) {
    try {
      await redis.connect()
      const raw = await redis.get('parceiros_store')
      await redis.disconnect()
      if (raw) return new Map(Object.entries(JSON.parse(raw) as Record<string,Parceiro>))
    } catch(e) { console.error('Redis load error:', e); try { await redis.disconnect() } catch {} }
  }
  if (!global.__store) { global.__store = new Map(); SEED.forEach(p => global.__store!.set(p.id, {...p})) }
  return global.__store
}

async function saveStore(store: Map<string,Parceiro>) {
  global.__store = store
  const redis = await getRedis()
  if (redis) {
    try {
      await redis.connect()
      await redis.set('parceiros_store', JSON.stringify(Object.fromEntries(store.entries())))
      await redis.disconnect()
    } catch(e) { console.error('Redis save error:', e); try { await redis.disconnect() } catch {} }
  }
}

export async function GET(req: NextRequest) {
  const store = await loadStore()
  const {searchParams} = new URL(req.url)
  const prom=searchParams.get('promotora'); const loja=searchParams.get('loja')
  const q=searchParams.get('quadrante'); const status=searchParams.get('status')
  let list = Array.from(store.values())
  if (prom)   list=list.filter(p=>p.promotora===prom)
  if (loja)   list=list.filter(p=>p.loja===loja)
  if (q)      list=list.filter(p=>p.quadrante===q)
  if (status) list=list.filter(p=>status==='sem_status'?!p.status:p.status===status)
  return NextResponse.json(list.sort((a,b)=>b.mar_prod-a.mar_prod))
}

export async function PATCH(req: NextRequest) {
  const store = await loadStore()
  const {id,status,observacao,autor,parceiros_bulk} = await req.json()
  if (parceiros_bulk) {
    const novos = parceiros_bulk as Parceiro[]
    novos.forEach(np => {
      const existing = store.get(np.id)
      store.set(np.id, {...np, status:existing?.status||null, observacoes:existing?.observacoes||[], ultima_atualizacao:existing?.ultima_atualizacao})
    })
    await saveStore(store)
    return NextResponse.json({ok:true, count:novos.length})
  }
  const p = store.get(id)
  if (!p) return NextResponse.json({error:'not found'},{status:404})
  if (status !== undefined) { p.status=status as StatusCRM; p.ultima_atualizacao=new Date().toISOString() }
  if (observacao?.trim()) {
    const o: Observacao = {id:`obs-${Date.now()}`,texto:observacao.trim(),autor:autor||'Equipe',data:new Date().toISOString()}
    p.observacoes=[o,...(p.observacoes||[])]; p.ultima_atualizacao=new Date().toISOString()
  }
  store.set(id,p); await saveStore(store)
  return NextResponse.json(p)
}

export async function DELETE(req: NextRequest) {
  const store = await loadStore()
  const {id,obs_id} = await req.json()
  const p = store.get(id)
  if (!p) return NextResponse.json({error:'not found'},{status:404})
  p.observacoes=p.observacoes.filter(o=>o.id!==obs_id)
  store.set(id,p); await saveStore(store)
  return NextResponse.json(p)
}
