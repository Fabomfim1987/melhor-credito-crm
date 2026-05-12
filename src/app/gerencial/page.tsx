'use client'
import { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, TrendingUp, Users, RefreshCw, ArrowUpRight, ExternalLink } from 'lucide-react'
import { Parceiro, STATUS_CFG, StatusCRM } from '@/types'

const brl = (v: number) => v === 0 ? 'R$ 0' : new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(v)
const pct = (v: number) => `${v>0?'+':''}${v.toFixed(0)}%`

const GESTORES = [
  {key:'VALERIA', label:'Valeria', initials:'VA', bg:'#dbeafe', color:'#0c447c'},
  {key:'PEDRO',   label:'Pedro',   initials:'PE', bg:'#fef3c7', color:'#78350f'},
  {key:'ERALDO',  label:'Eraldo',  initials:'ER', bg:'#dcfce7', color:'#14532d'},
]

function statusCounts(parceiros: Parceiro[]) {
  const counts: Record<string,number> = {ativo:0,parou:0,migrou:0,venda_fraca:0,em_negociacao:0,lista_transmissao:0,sem_status:0}
  parceiros.forEach(p => { if (p.status) counts[p.status]++; else counts.sem_status++ })
  return counts
}

function ultimaObs(parceiros: Parceiro[]): string {
  const datas = parceiros.flatMap(p => p.observacoes?.map(o => o.data) || [])
  if (!datas.length) return 'Sem registro'
  const ultima = new Date(Math.max(...datas.map(d => new Date(d).getTime())))
  const diff = Math.floor((Date.now() - ultima.getTime()) / 1000)
  if (diff < 3600) return `há ${Math.floor(diff/60)}min`
  if (diff < 86400) return `hoje ${ultima.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`
  return `${ultima.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})} ${ultima.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`
}

function negociacoesParadas(parceiros: Parceiro[]): Parceiro[] {
  return parceiros.filter(p => {
    if (p.status !== 'em_negociacao') return false
    const obs = p.observacoes || []
    if (!obs.length) return true
    const ultima = new Date(obs[0].data)
    return (Date.now() - ultima.getTime()) > 5 * 86400000
  })
}

export default function GerencialPage() {
  const [parceiros, setParceiros] = useState<Parceiro[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const r = await fetch('/api/parceiros')
    setParceiros(await r.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const totalProj   = parceiros.reduce((a,p)=>a+p.proj_prod,0)
  const totalAbr    = parceiros.reduce((a,p)=>a+p.abr_prod,0)
  const totalMar    = parceiros.reduce((a,p)=>a+p.mar_prod,0)
  const totalGap    = parceiros.reduce((a,p)=>a+p.gap_prod,0)
  const totalMedia  = parceiros.filter(p=>p.media_2025).reduce((a,p)=>a+(p.media_2025||0),0)
  const nMedia      = parceiros.filter(p=>p.media_2025).length
  const vsMedia2025 = totalMedia>0 ? (totalProj-totalMedia)/totalMedia*100 : null
  const semStatus   = parceiros.filter(p=>!p.status&&['Q1','Q2'].includes(p.quadrante)).length
  const emNeg       = parceiros.filter(p=>p.status==='em_negociacao').length
  const negParadas  = negociacoesParadas(parceiros)
  const crmAll      = statusCounts(parceiros)

  const badge = (label:string, n:number, bg:string, color:string, border:string) => (
    <span style={{fontSize:9,fontWeight:500,padding:'2px 6px',borderRadius:10,background:bg,color,border:`0.5px solid ${border}`,whiteSpace:'nowrap'}}>
      {n} {label}
    </span>
  )

  return (
    <div style={{minHeight:'100vh',background:'#f0f2f5',fontFamily:'var(--font-sans, system-ui)'}}>
      {/* Topbar */}
      <div style={{background:'#07294a',color:'#fff',padding:'0 20px',height:52,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:50,boxShadow:'0 2px 8px rgba(0,0,0,0.2)'}}>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <div>
            <div style={{fontSize:14,fontWeight:600,letterSpacing:'-0.2px'}}>Melhor Crédito</div>
            <div style={{fontSize:9,color:'#7cc8fb',letterSpacing:'0.08em',fontWeight:600}}>GERENCIAL</div>
          </div>
          <div style={{width:1,height:26,background:'rgba(255,255,255,0.12)'}}/>
          <div style={{display:'flex',gap:4}}>
            {[
              {label:'Dashboard',href:'/gerencial',active:true},{label:'Upload dados',href:'/upload'},
              {label:'Painel completo',href:'/'},
              {label:'Pedro',href:'/?loja=PEDRO'},
              {label:'Valeria',href:'/?loja=VALERIA'},
              {label:'Eraldo',href:'/?loja=ERALDO'},
            ].map(t=>(
              <a key={t.label} href={t.href} style={{padding:'4px 10px',fontSize:11,borderRadius:4,
                background:t.active?'rgba(255,255,255,0.18)':'transparent',
                color:t.active?'#fff':'rgba(255,255,255,0.6)',textDecoration:'none',fontWeight:t.active?500:400}}>
                {t.label}
              </a>
            ))}
          </div>
        </div>
        <button onClick={load} style={{display:'flex',alignItems:'center',gap:5,padding:'5px 12px',borderRadius:7,
          background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.14)',color:'#fff',cursor:'pointer',fontSize:11}}>
          <RefreshCw style={{width:12,height:12}}/> Atualizar
        </button>
      </div>

      <div style={{maxWidth:1400,margin:'0 auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:12}}>
        {loading ? (
          <div style={{textAlign:'center',padding:'60px',color:'#94a3b8',fontSize:14}}>Carregando...</div>
        ) : <>

        {/* KPIs */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10}}>
          {[
            {label:'Projeção abril',val:brl(totalProj),sub:vsMedia2025!==null?`${pct(vsMedia2025)} vs média 2025`:null,color:'#07294a',icon:<ArrowUpRight style={{width:16,height:16}}/>,pos:totalProj>=totalMar},
            {label:'Realizado',val:brl(totalAbr),sub:`${totalMar>0?(totalAbr/totalMar*100).toFixed(0):0}% de março`,color:'#0369a1',icon:<TrendingUp style={{width:16,height:16}}/>},
            {label:'Gap total',val:brl(Math.abs(totalGap)),sub:totalGap>=0?'acima do pro-rata':'abaixo do pro-rata',color:totalGap>=0?'#16a34a':'#dc2626',icon:<TrendingUp style={{width:16,height:16}}/>},
            {label:'Sem tabulação',val:String(semStatus),sub:'Q1/Q2 sem status',color:'#d97706',icon:<AlertTriangle style={{width:16,height:16}}/>},
            {label:'Em negociação',val:String(emNeg),sub:`${negParadas.length} paradas há +5 dias`,color:negParadas.length>0?'#dc2626':'#0369a1',icon:<Users style={{width:16,height:16}}/>},
          ].map(k=>(
            <div key={k.label} style={{background:'#fff',borderRadius:10,padding:'12px 14px',border:'0.5px solid #e8ecf0',display:'flex',gap:10,alignItems:'flex-start'}}>
              <div style={{width:32,height:32,borderRadius:8,flexShrink:0,background:k.color+'18',color:k.color,display:'flex',alignItems:'center',justifyContent:'center'}}>{k.icon}</div>
              <div>
                <div style={{fontSize:9,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:2}}>{k.label}</div>
                <div style={{fontSize:20,fontWeight:600,color:k.label==='Gap total'?(totalGap>=0?'#16a34a':'#dc2626'):'#0f172a',lineHeight:1}}>{k.val}</div>
                {k.sub && <div style={{fontSize:10,color:'#64748b',marginTop:2}}>{k.sub}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* Cards por gestor */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
          {GESTORES.map(g => {
            const gp = parceiros.filter(p => p.loja === g.key)
            const proj = gp.reduce((a,p)=>a+p.proj_prod,0)
            const gap  = gp.reduce((a,p)=>a+p.gap_prod,0)
            const mar  = gp.reduce((a,p)=>a+p.mar_prod,0)
            const cnt  = statusCounts(gp)
            const tab  = gp.filter(p=>p.status).length
            const pct_tab = gp.length>0 ? tab/gp.length : 0
            const upd  = ultimaObs(gp)
            const alertas = gp.filter(p=>['Q1','Q2'].includes(p.quadrante)&&!p.status).length

            return (
              <div key={g.key} style={{background:'#fff',borderRadius:10,border:'0.5px solid #e8ecf0',overflow:'hidden'}}>
                {/* Header */}
                <div style={{padding:'10px 14px 8px',borderBottom:'0.5px solid #f1f5f9',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{width:30,height:30,borderRadius:'50%',background:g.bg,color:g.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:600}}>{g.initials}</div>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:'#0f172a'}}>{g.label}</div>
                      <div style={{fontSize:9,color:'#94a3b8'}}>ult. registro: {upd}</div>
                    </div>
                  </div>
                  {alertas > 0 && (
                    <span style={{fontSize:9,fontWeight:600,padding:'3px 8px',borderRadius:10,background:'#fef3c7',color:'#78350f',border:'0.5px solid #fcd34d'}}>
                      {alertas} sem tabulação
                    </span>
                  )}
                </div>

                {/* Métricas */}
                <div style={{padding:'10px 14px',display:'flex',flexDirection:'column',gap:5}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:10,color:'#64748b'}}>Parceiros</span>
                    <span style={{fontSize:11,fontWeight:500,color:'#0f172a'}}>{gp.length}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:10,color:'#64748b'}}>Projeção produção</span>
                    <span style={{fontSize:12,fontWeight:600,color:proj>=mar?'#16a34a':'#dc2626'}}>{brl(proj)}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:10,color:'#64748b'}}>Gap vs pro-rata</span>
                    <span style={{fontSize:11,fontWeight:600,color:gap>=0?'#16a34a':'#dc2626'}}>{gap>=0?'+':''}{brl(gap)}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:10,color:'#64748b'}}>Tabulados</span>
                    <span style={{fontSize:11,fontWeight:500,color:'#0f172a'}}>{tab} / {gp.length}</span>
                  </div>
                  {/* Barra */}
                  <div style={{height:4,background:'#f1f5f9',borderRadius:2,marginTop:4,overflow:'hidden'}}>
                    <div style={{height:4,borderRadius:2,width:`${pct_tab*100}%`,
                      background:pct_tab>0.6?'#16a34a':pct_tab>0.3?'#f59e0b':'#dc2626'}}/>
                  </div>
                </div>

                {/* Badges status */}
                <div style={{padding:'8px 14px',borderTop:'0.5px solid #f1f5f9',display:'flex',gap:4,flexWrap:'wrap'}}>
                  {cnt.ativo>0 && badge(`ativo${cnt.ativo>1?'s':''}`,cnt.ativo,'#dcfce7','#14532d','#86efac')}
                  {cnt.em_negociacao>0 && badge('negociação',cnt.em_negociacao,'#ccfbf1','#134e4a','#5eead4')}
                  {cnt.parou>0 && badge('parou',cnt.parou,'#fee2e2','#7f1d1d','#fca5a5')}
                  {cnt.migrou>0 && badge('migrou',cnt.migrou,'#dbeafe','#1e3a5f','#93c5fd')}
                  {cnt.venda_fraca>0 && badge('venda fraca',cnt.venda_fraca,'#fef3c7','#78350f','#fcd34d')}
                  {cnt.lista_transmissao>0 && badge('lista transm.',cnt.lista_transmissao,'#ede9fe','#4c1d95','#c4b5fd')}
                  {cnt.sem_status>0 && badge('sem status',cnt.sem_status,'#f3f4f6','#374151','#d1d5db')}
                </div>

                {/* Link */}
                <a href={`/?loja=${g.key}`} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:5,padding:'8px',borderTop:'0.5px solid #f1f5f9',fontSize:11,color:'#07294a',textDecoration:'none',background:'#f8fafc',fontWeight:500}}>
                  <ExternalLink style={{width:11,height:11}}/> Ver carteira completa
                </a>
              </div>
            )
          })}
        </div>

        {/* Alertas */}
        <div style={{background:'#fff',borderRadius:10,border:'0.5px solid #e8ecf0',padding:'12px 14px'}}>
          <div style={{fontSize:10,fontWeight:600,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:10}}>Alertas — ação imediata</div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {/* Sem tabulação por gestor */}
            {GESTORES.map(g => {
              const n = parceiros.filter(p=>p.loja===g.key&&['Q1','Q2'].includes(p.quadrante)&&!p.status).length
              if (n===0) return null
              return (
                <div key={g.key} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:7,background:'#fff7ed',border:'0.5px solid #fed7aa'}}>
                  <div style={{width:7,height:7,borderRadius:'50%',background:'#f59e0b',flexShrink:0}}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:11,fontWeight:500,color:'#0f172a'}}>{n} parceiro{n>1?'s':''} da carteira {g.label} Q1/Q2 sem tabulação</div>
                    <div style={{fontSize:10,color:'#94a3b8',marginTop:1}}>Não sabemos o que está acontecendo com eles</div>
                  </div>
                  <a href={`/?loja=${g.key}`} style={{fontSize:10,color:'#78350f',textDecoration:'none',fontWeight:600,whiteSpace:'nowrap'}}>Ver carteira →</a>
                </div>
              )
            })}
            {/* Negociações paradas */}
            {negParadas.map(p => (
              <div key={p.id} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:7,background:'#fef2f2',border:'0.5px solid #fecaca'}}>
                <div style={{width:7,height:7,borderRadius:'50%',background:'#dc2626',flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,fontWeight:500,color:'#0f172a'}}>{p.nome} — Em Negociação sem nova observação</div>
                  <div style={{fontSize:10,color:'#94a3b8',marginTop:1}}>{p.promotora}/{p.loja} · gap prod. {p.gap_prod>=0?'+':''}{brl(p.gap_prod)}</div>
                </div>
                <span style={{fontSize:10,color:'#7f1d1d',fontWeight:600,whiteSpace:'nowrap'}}>+5 dias</span>
              </div>
            ))}
            {semStatus===0 && negParadas.length===0 && (
              <div style={{textAlign:'center',padding:'16px',color:'#94a3b8',fontSize:13}}>Nenhum alerta no momento.</div>
            )}
          </div>
        </div>

        {/* CRM geral */}
        <div style={{background:'#fff',borderRadius:10,border:'0.5px solid #e8ecf0',padding:'12px 14px'}}>
          <div style={{fontSize:10,fontWeight:600,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:10}}>CRM — situação geral ({parceiros.length} parceiros)</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:8}}>
            {[
              {key:'ativo',label:'Ativo',bg:'#dcfce7',color:'#14532d',border:'#86efac'},
              {key:'em_negociacao',label:'Em negociação',bg:'#ccfbf1',color:'#134e4a',border:'#5eead4'},
              {key:'parou',label:'Parou',bg:'#fee2e2',color:'#7f1d1d',border:'#fca5a5'},
              {key:'migrou',label:'Migrou',bg:'#dbeafe',color:'#1e3a5f',border:'#93c5fd'},
              {key:'lista_transmissao',label:'Lista transmissão',bg:'#ede9fe',color:'#4c1d95',border:'#c4b5fd'},
              {key:'sem_status',label:'Sem status',bg:'#f3f4f6',color:'#374151',border:'#d1d5db'},
            ].map(s=>(
              <div key={s.key} style={{borderRadius:8,padding:'10px 11px',background:s.bg,border:`0.5px solid ${s.border}`}}>
                <div style={{fontSize:9,fontWeight:500,color:s.color,marginBottom:4}}>{s.label}</div>
                <div style={{fontSize:22,fontWeight:600,color:s.color,lineHeight:1}}>{crmAll[s.key]||0}</div>
                <div style={{fontSize:9,color:s.color,opacity:0.7,marginTop:3}}>
                  {parceiros.length>0?((crmAll[s.key]||0)/parceiros.length*100).toFixed(0):0}% do total
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{fontSize:11,color:'#94a3b8',textAlign:'center'}}>
          Melhor Crédito · Gerencial · Nova + GLM + Lev · {new Date().toLocaleDateString('pt-BR')}
        </div>
        </>}
      </div>
    </div>
  )
}
