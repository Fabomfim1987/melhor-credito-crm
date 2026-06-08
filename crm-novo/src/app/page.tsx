'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, X, ChevronDown, Send, User, RefreshCw, TrendingUp, AlertTriangle, Users, ArrowUpRight, MessageSquare, ChevronRight, Trash2, Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react'
import { BASE_2025 } from '../base2025'
import { Parceiro, StatusCRM, STATUS_CFG, Q_CFG, PERFIL_CFG } from '@/types'

const brl = (v: number) => v === 0 ? 'R$ 0' : new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(v)
const pct = (v: number|null) => v===null ? '—' : `${v>0?'+':''}${v.toFixed(0)}%`
const gapClr = (v: number) => v >= 0 ? '#16a34a' : '#dc2626'
const varClr = (v: number|null) => v===null ? '#94a3b8' : v >= 0 ? '#16a34a' : '#dc2626'
const fmtDate = (iso: string) => {
  const dt = new Date(iso)
  const diff = Math.floor((Date.now()-dt.getTime())/1000)
  const data = dt.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})
  const hora = dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
  if (diff < 60) return `agora · ${hora}`
  if (diff < 86400) return `hoje ${hora}`
  return `${data} ${hora}`
}
const mesCurto = (s: string|null) => {
  if (!s) return '—'
  const m = s.match(/(\d{4})-(\d{2})/)
  if (!m) return s
  const n = ['','jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
  return `${n[parseInt(m[2])]}/${m[1].slice(2)}`
}
const mesLabel = (chave: string) => {
  const [mm, yyyy] = chave.split('/')
  const nomes = ['','jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
  return `${nomes[parseInt(mm)]}/${yyyy.slice(2)}`
}

const DU_TOT = 22
type Tab = 'gerencial'|'todos'|'VALERIA'|'PEDRO'|'ERALDO'|'upload'

// ── BADGES ─────────────────────────────────────────────────────────────────
function StatusBadge({status,tiny}:{status:StatusCRM;tiny?:boolean}) {
  if (!status) return <span style={{fontSize:tiny?9:11,color:'#cbd5e1',fontStyle:'italic'}}>—</span>
  const c=STATUS_CFG[status]
  return <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:tiny?9:11,fontWeight:600,padding:tiny?'2px 7px':'3px 10px',borderRadius:20,background:c.bg,color:c.color,border:`1px solid ${c.border}`,whiteSpace:'nowrap'}}><span style={{width:5,height:5,borderRadius:'50%',background:c.dot,display:'inline-block'}}/>{c.label}</span>
}
function QBadge({q}:{q:string}) {
  const c=Q_CFG[q]||Q_CFG['Q6']
  return <span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:4,background:c.bg,color:c.color,whiteSpace:'nowrap'}}>{q}</span>
}
function PerfilBadge({perfil}:{perfil:string|null}) {
  if (!perfil) return <span style={{fontSize:9,color:'#94a3b8'}}>Novo</span>
  const c=PERFIL_CFG[perfil]||{color:'#374151',bg:'#f3f4f6'}
  return <span style={{fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:4,background:c.bg,color:c.color,whiteSpace:'nowrap'}}>{perfil.replace('PRODUTOR ','')}</span>
}

// ── STATUS PICKER ──────────────────────────────────────────────────────────
function StatusPicker({current,onChange}:{current:StatusCRM;onChange:(s:StatusCRM)=>void}) {
  const [open,setOpen]=useState(false)
  const ref=useRef<HTMLDivElement>(null)
  useEffect(()=>{
    const h=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false)}
    document.addEventListener('mousedown',h); return ()=>document.removeEventListener('mousedown',h)
  },[])
  const opts:{value:StatusCRM;label:string}[]=[{value:'ativo',label:'Ativo'},{value:'parou',label:'Parou'},{value:'migrou',label:'Migrou'},{value:'venda_fraca',label:'Venda Fraca'},{value:'em_negociacao',label:'Em Negociação'},{value:'lista_transmissao',label:'Lista de Transmissão'}]
  return (
    <div ref={ref} style={{position:'relative'}}>
      <button onClick={()=>setOpen(!open)} style={{display:'flex',alignItems:'center',gap:5,padding:'4px 8px',borderRadius:8,border:'1px solid #e2e8f0',background:'#fff',cursor:'pointer',minWidth:130}}>
        <StatusBadge status={current} tiny/><ChevronDown style={{width:10,height:10,color:'#94a3b8',marginLeft:'auto',flexShrink:0}}/>
      </button>
      {open&&(
        <div style={{position:'absolute',top:'110%',left:0,zIndex:999,background:'#fff',border:'1px solid #e2e8f0',borderRadius:10,boxShadow:'0 8px 32px rgba(0,0,0,0.14)',minWidth:230,overflow:'hidden'}}>
          <div style={{padding:'6px 12px',fontSize:9,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.08em',borderBottom:'1px solid #f1f5f9'}}>Alterar status</div>
          {[{value:null as StatusCRM,label:'— Remover status'},...opts].map(opt=>{
            const cfg=opt.value?STATUS_CFG[opt.value]:null
            return <button key={String(opt.value)} onClick={()=>{onChange(opt.value);setOpen(false)}} style={{width:'100%',textAlign:'left',padding:'9px 14px',display:'flex',alignItems:'flex-start',gap:10,background:current===opt.value?'#f8fafc':'#fff',border:'none',cursor:'pointer',borderBottom:'1px solid #f8fafc'}}>
              {cfg?<span style={{width:8,height:8,borderRadius:'50%',background:cfg.dot,flexShrink:0,marginTop:3}}/>:<span style={{width:8,height:8,flexShrink:0}}/>}
              <div><div style={{fontWeight:600,fontSize:12,color:cfg?cfg.color:'#94a3b8'}}>{opt.label}</div>{cfg&&<div style={{fontSize:10,color:'#94a3b8',marginTop:1}}>{cfg.desc}</div>}</div>
            </button>
          })}
        </div>
      )}
    </div>
  )
}

// ── FICHA ──────────────────────────────────────────────────────────────────
function Ficha({p,onClose,onUpdate}:{p:Parceiro;onClose:()=>void;onUpdate:(p:Parceiro)=>void}) {
  const [obs,setObs]=useState('');const [autor,setAutor]=useState('Fabricio');const [saving,setSaving]=useState(false)
  const updateStatus=async(status:StatusCRM)=>{const r=await fetch('/api/parceiros',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:p.id,status})});onUpdate(await r.json())}
  const addObs=async()=>{if(!obs.trim())return;setSaving(true);const r=await fetch('/api/parceiros',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:p.id,observacao:obs,autor})});onUpdate(await r.json());setObs('');setSaving(false)}
  const delObs=async(obs_id:string)=>{const r=await fetch('/api/parceiros',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:p.id,obs_id})});onUpdate(await r.json())}
  const Num=({label,val,sub,sc}:{label:string;val:number;sub?:string;sc?:string})=>(
    <div style={{background:'#f8fafc',borderRadius:8,padding:'9px 11px',border:'0.5px solid #f1f5f9'}}>
      <div style={{fontSize:9,color:'#94a3b8',marginBottom:2,textTransform:'uppercase',letterSpacing:'0.05em'}}>{label}</div>
      <div style={{fontSize:14,fontWeight:600,color:'#0f172a'}}>{brl(val)}</div>
      {sub&&<div style={{fontSize:10,fontWeight:600,color:sc||'#64748b',marginTop:1}}>{sub}</div>}
    </div>
  )
  const vsMedia=p.media_2025&&p.media_2025>0?((p.proj_prod-p.media_2025)/p.media_2025*100):null
  const vsPico=p.pico_2025&&p.pico_2025>0?(p.proj_prod/p.pico_2025*100):null
  const meses=p.meses_display||[]
  return (
    <div style={{position:'fixed',inset:0,zIndex:200,display:'flex',justifyContent:'flex-end'}}>
      <div onClick={onClose} style={{position:'absolute',inset:0,background:'rgba(15,23,42,0.4)',backdropFilter:'blur(2px)'}}/>
      <div style={{position:'relative',width:'100%',maxWidth:520,background:'#fff',height:'100vh',display:'flex',flexDirection:'column',boxShadow:'-12px 0 48px rgba(0,0,0,0.15)',overflowY:'auto'}}>
        <div style={{padding:'18px 22px 14px',borderBottom:'0.5px solid #f1f5f9',position:'sticky',top:0,background:'#fff',zIndex:10}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div><div style={{fontSize:10,color:'#94a3b8',marginBottom:3,textTransform:'uppercase',letterSpacing:'0.06em'}}>{p.promotora} · {p.loja} · #{p.nr}</div>
              <h2 style={{fontSize:16,fontWeight:700,color:'#0f172a',lineHeight:1.2}}>{p.nome}</h2></div>
            <button onClick={onClose} style={{border:'none',background:'#f1f5f9',borderRadius:8,width:30,height:30,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}><X style={{width:14,height:14,color:'#64748b'}}/></button>
          </div>
          <div style={{marginTop:8,display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
            <QBadge q={p.quadrante}/><PerfilBadge perfil={p.perfil_2025||null}/>
            <span style={{fontSize:10,color:'#94a3b8'}}>{p.du}du · {p.fator}×</span>
          </div>
          <div style={{marginTop:8}}><StatusPicker current={p.status} onChange={updateStatus}/></div>
        </div>
        {p.media_2025&&(
          <div style={{padding:'12px 22px',borderBottom:'0.5px solid #f1f5f9',background:'#fafbff'}}>
            <div style={{fontSize:10,fontWeight:700,color:'#4f46e5',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>Histórico 2025</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
              <Num label="Média mensal" val={p.media_2025} sub={`${p.meses_ativos||0} meses ativos`}/>
              <Num label={`Pico · ${mesCurto(p.pico_mes)}`} val={p.pico_2025||0} sub="Melhor mês"/>
              <Num label="Total 2025" val={p.total_2025||0} sub={p.perfil_2025?.replace('PRODUTOR ','')||''} sc={PERFIL_CFG[p.perfil_2025||'']?.color||'#64748b'}/>
            </div>
            {vsMedia!==null&&(
              <div style={{marginTop:8,padding:'7px 11px',borderRadius:8,background:vsMedia>=0?'#f0fdf4':'#fff7ed',border:`0.5px solid ${vsMedia>=0?'#bbf7d0':'#fed7aa'}`}}>
                <span style={{fontSize:11,color:vsMedia>=0?'#15803d':'#c2410c',fontWeight:600}}>{vsMedia>=0?'▲':'▼'} Projeção {pct(vsMedia)} vs média 2025</span>
                {vsPico!==null&&<span style={{fontSize:10,color:'#94a3b8',marginLeft:8}}>· {vsPico.toFixed(0)}% do pico</span>}
              </div>
            )}
          </div>
        )}
        {meses.length>0&&(
          <div style={{padding:'12px 22px',borderBottom:'0.5px solid #f1f5f9'}}>
            <div style={{fontSize:10,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>Produção — Últimos 3 meses</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
              {meses.map((m,i)=>(
                <div key={m.mes} style={{background:'#f8fafc',borderRadius:8,padding:'9px 11px',border:`0.5px solid ${i===2?'#bfdbfe':'#f1f5f9'}`}}>
                  <div style={{fontSize:9,color:'#94a3b8',marginBottom:3,textTransform:'uppercase',fontWeight:600}}>{mesLabel(m.mes)}{i===2?' · atual':''}</div>
                  <div style={{fontSize:14,fontWeight:700,color:'#0f172a'}}>{brl(m.prod)}</div>
                  <div style={{fontSize:10,color:'#94a3b8',marginTop:2}}>{brl(m.dig)} dig.</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {p.ultimo_dia&&(p.ultimo_dia.prod>0||p.ultimo_dia.dig>0)&&(
          <div style={{padding:'12px 22px',borderBottom:'0.5px solid #f1f5f9'}}>
            <div style={{fontSize:10,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>Último Dia · {p.ultimo_dia.data}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <Num label="Prod. dia" val={p.ultimo_dia.prod}/>
              <Num label="Dig. dia" val={p.ultimo_dia.dig}/>
            </div>
          </div>
        )}
        <div style={{padding:'12px 22px',borderBottom:'0.5px solid #f1f5f9'}}>
          <div style={{fontSize:10,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>Mês atual ({p.du}du) — Esperado vs Real</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
            <Num label="Pro-rata Prod." val={p.prorata_prod} sub="Ritmo do mês anterior"/>
            <Num label="Prod. Real" val={p.abr_prod} sub={`Gap: ${p.gap_prod>=0?'+':''}${brl(p.gap_prod)}`} sc={gapClr(p.gap_prod)}/>
            <Num label="Pro-rata Dig." val={p.prorata_dig} sub="Ritmo do mês anterior"/>
            <Num label="Dig. Real" val={p.abr_dig} sub={`Gap: ${p.gap_dig>=0?'+':''}${brl(p.gap_dig)}`} sc={gapClr(p.gap_dig)}/>
          </div>
          <div style={{fontSize:10,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>Projeção (22du)</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            <Num label="Proj. Prod." val={p.proj_prod} sub={pct(p.var_prod)+' vs mês ant.'} sc={varClr(p.var_prod)}/>
            <Num label="Proj. Dig." val={p.proj_dig} sub={pct(p.var_dig)+' vs mês ant.'} sc={varClr(p.var_dig)}/>
          </div>
        </div>
        <div style={{padding:'12px 22px 24px',flex:1}}>
          <div style={{fontSize:10,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>Observações ({p.observacoes?.length||0})</div>
          <div style={{border:'0.5px solid #e2e8f0',borderRadius:10,overflow:'hidden',marginBottom:10}}>
            <textarea value={obs} onChange={e=>setObs(e.target.value)} placeholder="Ex: Parceiro solicitou 0,20% na Facta para tombar tudo pra nós..." rows={3}
              style={{width:'100%',border:'none',outline:'none',resize:'none',padding:'11px 13px',fontSize:13,color:'#0f172a',fontFamily:'inherit',lineHeight:1.5}}
              onKeyDown={e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey))addObs()}}/>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 11px',borderTop:'0.5px solid #f1f5f9',background:'#f8fafc'}}>
              <div style={{display:'flex',alignItems:'center',gap:5}}><User style={{width:11,height:11,color:'#94a3b8'}}/>
                <select value={autor} onChange={e=>setAutor(e.target.value)} style={{fontSize:11,border:'none',background:'transparent',color:'#64748b',cursor:'pointer'}}>
                  {['Fabricio','Valeria','Pedro','Eraldo'].map(a=><option key={a}>{a}</option>)}
                </select>
              </div>
              <button onClick={addObs} disabled={!obs.trim()||saving} style={{display:'flex',alignItems:'center',gap:4,padding:'5px 12px',borderRadius:8,border:'none',background:obs.trim()?'#07294a':'#e2e8f0',color:obs.trim()?'#fff':'#94a3b8',cursor:obs.trim()?'pointer':'default',fontSize:11,fontWeight:600}}>
                <Send style={{width:11,height:11}}/>{saving?'Salvando...':'Salvar'}
              </button>
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:7}}>
            {!(p.observacoes?.length)?<div style={{textAlign:'center',padding:'20px',color:'#94a3b8',fontSize:13}}>Nenhuma observação ainda.</div>
              :p.observacoes.map(o=>(
              <div key={o.id} style={{background:'#f8fafc',borderRadius:8,padding:'9px 11px',border:'0.5px solid #f1f5f9'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4,alignItems:'center'}}>
                  <div style={{display:'flex',alignItems:'center',gap:5}}><span style={{fontSize:11,fontWeight:700,color:'#07294a'}}>{o.autor}</span><span style={{fontSize:10,color:'#94a3b8'}}>{fmtDate(o.data)}</span></div>
                  <button onClick={()=>delObs(o.id)} style={{border:'none',background:'none',cursor:'pointer',color:'#cbd5e1',padding:2}}><Trash2 style={{width:11,height:11}}/></button>
                </div>
                <p style={{margin:0,fontSize:13,color:'#374151',lineHeight:1.5}}>{o.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── COLUNA MÊS ──────────────────────────────────────────────────────────────
function ColMes({prod,dig,destaque}:{prod:number;dig:number;destaque?:boolean}) {
  return (
    <td style={{padding:'9px 10px',textAlign:'right'}}>
      <div style={{fontSize:12,fontWeight:destaque?700:600,color:destaque?'#07294a':'#0f172a'}}>{brl(prod)}</div>
      <div style={{fontSize:10,color:'#94a3b8'}}>{brl(dig)} dig.</div>
    </td>
  )
}

// ── LINHA TABELA ────────────────────────────────────────────────────────────
function Linha({p,onFicha,onStatus}:{p:Parceiro;onFicha:()=>void;onStatus:(id:string,s:StatusCRM)=>void}) {
  const updateStatus=async(s:StatusCRM)=>{await fetch('/api/parceiros',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:p.id,status:s})});onStatus(p.id,s)}
  const alerta=['Q1','Q2'].includes(p.quadrante)&&!p.status
  const qc=Q_CFG[p.quadrante]||Q_CFG['Q6']
  const vsMedia=p.media_2025&&p.media_2025>0?((p.proj_prod-p.media_2025)/p.media_2025*100):null
  const meses=p.meses_display||[]
  const m0=meses[0]||{prod:0,dig:0}
  const m1=meses[1]||{prod:p.mar_prod||0,dig:p.mar_dig||0}
  const m2=meses[2]||{prod:0,dig:0}
  const m3=meses[3]||{prod:p.abr_prod||0,dig:p.abr_dig||0}
  const ud=p.ultimo_dia
  return (
    <tr style={{borderBottom:'0.5px solid #f1f5f9',background:alerta?'#fffbeb':'#fff',transition:'background 0.15s'}}
      onMouseEnter={e=>{(e.currentTarget as HTMLTableRowElement).style.background='#f8fafc'}}
      onMouseLeave={e=>{(e.currentTarget as HTMLTableRowElement).style.background=alerta?'#fffbeb':'#fff'}}>
      <td style={{padding:'9px 14px',minWidth:180}}>
        <div style={{fontSize:13,fontWeight:600,color:'#0f172a',lineHeight:1.2}}>{p.nome}</div>
        <div style={{fontSize:10,color:'#94a3b8',marginTop:2,display:'flex',gap:5,alignItems:'center'}}>
          <span>#{p.nr} · {p.promotora}/{p.loja}</span><PerfilBadge perfil={p.perfil_2025||null}/>
        </div>
      </td>
      <td style={{padding:'9px 8px',textAlign:'center'}}><span style={{fontSize:10,fontWeight:700,padding:'3px 7px',borderRadius:4,background:qc.bg,color:qc.color}}>{p.quadrante}</span></td>
      <td style={{padding:'9px 10px',textAlign:'right'}}>
        <div style={{fontSize:12,fontWeight:600,color:'#0f172a'}}>{p.media_2025?brl(p.media_2025):'—'}</div>
        <div style={{fontSize:10,color:'#94a3b8'}}>pico {p.pico_2025?brl(p.pico_2025):'—'}</div>
      </td>
      <ColMes prod={m0.prod} dig={m0.dig}/>
      <ColMes prod={m1.prod} dig={m1.dig}/>
      <ColMes prod={m2.prod} dig={m2.dig}/>
      <ColMes prod={m3.prod} dig={m3.dig} destaque/>
      <td style={{padding:'9px 10px',textAlign:'right'}}>
        {ud&&(ud.prod>0||ud.dig>0)?(
          <><div style={{fontSize:12,fontWeight:600,color:'#7c3aed'}}>{brl(ud.prod)}</div><div style={{fontSize:10,color:'#94a3b8'}}>{brl(ud.dig)} dig.</div></>
        ):<span style={{fontSize:11,color:'#e2e8f0'}}>—</span>}
      </td>
      <td style={{padding:'9px 10px',textAlign:'right'}}>
        <div style={{fontSize:12,fontWeight:700,color:gapClr(p.gap_prod)}}>{p.gap_prod>=0?'+':''}{brl(p.gap_prod)}</div>
        <div style={{fontSize:10,fontWeight:600,color:gapClr(p.gap_dig)}}>{p.gap_dig>=0?'+':''}{brl(p.gap_dig)} dig.</div>
      </td>
      <td style={{padding:'9px 10px',textAlign:'right'}}>
        <div style={{fontSize:12,fontWeight:700,color:varClr(p.var_prod)}}>{brl(p.proj_prod)}</div>
        <div style={{fontSize:10,fontWeight:600,color:vsMedia!==null?varClr(vsMedia):varClr(p.var_prod)}}>
          {vsMedia!==null?`${pct(vsMedia)} vs média`:`${pct(p.var_prod)} vs ant.`}
        </div>
      </td>
      <td style={{padding:'9px 8px'}} onClick={e=>e.stopPropagation()}>
        <div>
          <StatusPicker current={p.status} onChange={updateStatus}/>
          {p.ultima_atualizacao&&p.status&&<div style={{fontSize:9,color:'#94a3b8',marginTop:3,paddingLeft:2}}>{fmtDate(p.ultima_atualizacao)}</div>}
        </div>
      </td>
      <td style={{padding:'9px 8px',textAlign:'center'}}>
        {(p.observacoes?.length||0)>0&&<span style={{fontSize:10,fontWeight:700,background:'#07294a',color:'#fff',borderRadius:10,padding:'1px 6px'}}>{p.observacoes.length}</span>}
      </td>
      <td style={{padding:'9px 8px'}}>
        <button onClick={onFicha} style={{display:'flex',alignItems:'center',gap:4,padding:'5px 9px',borderRadius:8,border:'0.5px solid #e2e8f0',background:'#fff',cursor:'pointer',fontSize:11,color:'#374151',fontWeight:500,whiteSpace:'nowrap'}}
          onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background='#eff6ff';(e.currentTarget as HTMLButtonElement).style.borderColor='#07294a'}}
          onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background='#fff';(e.currentTarget as HTMLButtonElement).style.borderColor='#e2e8f0'}}>
          <MessageSquare style={{width:12,height:12}}/> Ficha <ChevronRight style={{width:10,height:10}}/>
        </button>
      </td>
    </tr>
  )
}

// ── ABA TABELA ──────────────────────────────────────────────────────────────
function AbaTabela({parceiros,lojaFiltro,loading,onUpdate}:{parceiros:Parceiro[];lojaFiltro?:string;loading:boolean;onUpdate:(p:Parceiro)=>void}) {
  const [ficha,setFicha]=useState<Parceiro|null>(null)
  const [busca,setBusca]=useState('')
  const [fProm,setFProm]=useState('')
  const [fQ,setFQ]=useState('')
  const [fStatus,setFStatus]=useState('')
  const [fPerfil,setFPerfil]=useState('')

  // Header de meses: usar os meses reais que vêm do backend (alinhados com meses_display)
  const mesesHeader=(()=>{
    const md=parceiros[0]?.meses_display||[]
    const nomes=['','jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
    if (md.length>=1) {
      return md.map(m=>{
        const [mm,yy]=m.mes.split('/').map(Number)
        return `${nomes[mm]}/${String(yy).slice(2)}`
      })
    }
    // Fallback: 4 últimos meses baseado em hoje
    const hoje=new Date()
    return Array.from({length:4},(_,i)=>{
      const d=new Date(hoje.getFullYear(),hoje.getMonth()-3+i,1)
      return `${nomes[d.getMonth()+1]}/${String(d.getFullYear()).slice(2)}`
    })
  })()

  const filtrados=parceiros.filter(p=>{
    if (lojaFiltro) {
      if (lojaFiltro==='PEDRO') { if (!(p.loja==='PEDRO'||p.promotora==='GLM')) return false }
      else if (p.loja!==lojaFiltro) return false
    }
    if (busca&&!p.nome.toLowerCase().includes(busca.toLowerCase())&&!p.nr.includes(busca)) return false
    if (fProm&&p.promotora!==fProm) return false
    if (fQ&&p.quadrante!==fQ) return false
    if (fPerfil&&p.perfil_2025!==fPerfil) return false
    if (fStatus){if(fStatus==='sem_status'&&p.status!==null)return false;if(fStatus!=='sem_status'&&p.status!==fStatus)return false}
    return true
  })
  const promotoras=[...new Set(parceiros.map(p=>p.promotora))].sort()
  const perfis=[...new Set(parceiros.map(p=>p.perfil_2025).filter(Boolean))].sort() as string[]
  const limpo=busca||fProm||fQ||fStatus||fPerfil

  const headers=[
    ['Parceiro','left'],['Q','center'],['Média 2025 / Pico','right'],
    [mesesHeader[0],'right'],[mesesHeader[1],'right'],[mesesHeader[2],'right'],[`${mesesHeader[3]} ▶`,'right'],
    ['Último Dia','right'],['Gap','right'],['Projeção','right'],
    ['Status CRM','left'],['Obs','center'],['','center'],
  ]

  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      <div style={{background:'#fff',borderRadius:10,padding:'11px 14px',border:'0.5px solid #e8ecf0',display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
        <div style={{position:'relative',flex:'1',minWidth:200}}>
          <Search style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',width:13,height:13,color:'#94a3b8'}}/>
          <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar parceiro..."
            style={{width:'100%',padding:'8px 12px 8px 30px',border:'0.5px solid #e2e8f0',borderRadius:8,fontSize:13,outline:'none',color:'#0f172a'}}/>
        </div>
        {!lojaFiltro&&(
          <select value={fProm} onChange={e=>setFProm(e.target.value)} style={{padding:'8px 11px',border:'0.5px solid #e2e8f0',borderRadius:8,fontSize:12,color:fProm?'#0f172a':'#94a3b8',background:'#fff',cursor:'pointer',minWidth:120}}>
            <option value="">Promotora</option>
            {promotoras.map(o=><option key={o} value={o}>{o}</option>)}
          </select>
        )}
        {[{label:'Quadrante',val:fQ,set:setFQ,opts:['Q1','Q2','Q3','Q4','Q5','Q6']},
          {label:'Perfil 2025',val:fPerfil,set:setFPerfil,opts:perfis},
          {label:'Status CRM',val:fStatus,set:setFStatus,opts:['sem_status',...Object.keys(STATUS_CFG)]},
        ].map(f=>(
          <select key={f.label} value={f.val} onChange={e=>f.set(e.target.value)} style={{padding:'8px 11px',border:'0.5px solid #e2e8f0',borderRadius:8,fontSize:12,color:f.val?'#0f172a':'#94a3b8',background:'#fff',cursor:'pointer',minWidth:120}}>
            <option value="">{f.label}</option>
            {f.opts.map(o=><option key={o} value={o}>{o==='sem_status'?'— Sem status':STATUS_CFG[o as NonNullable<StatusCRM>]?.label||o.replace('PRODUTOR ','')}</option>)}
          </select>
        ))}
        {limpo&&<button onClick={()=>{setBusca('');setFProm('');setFQ('');setFStatus('');setFPerfil('')}} style={{display:'flex',alignItems:'center',gap:4,padding:'8px 10px',borderRadius:8,border:'0.5px solid #fca5a5',background:'#fee2e2',color:'#7f1d1d',cursor:'pointer',fontSize:12}}><X style={{width:12,height:12}}/> Limpar</button>}
        <span style={{fontSize:12,color:'#94a3b8',marginLeft:'auto'}}>{filtrados.length} parceiros</span>
      </div>
      <div style={{background:'#fff',borderRadius:10,border:'0.5px solid #e8ecf0',overflow:'hidden'}}>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:'#f0f4f8',borderBottom:'2px solid #e2e8f0'}}>
                {headers.map(([h,a])=>(
                  <th key={h} style={{padding:'10px 12px',textAlign:a as 'left'|'right'|'center',fontSize:9,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'0.07em',whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading?<tr><td colSpan={12} style={{padding:'48px',textAlign:'center',color:'#94a3b8'}}>Carregando...</td></tr>
              :filtrados.length===0?<tr><td colSpan={12} style={{padding:'48px',textAlign:'center',color:'#94a3b8'}}>Nenhum parceiro encontrado.</td></tr>
              :filtrados.map(p=><Linha key={p.id} p={p} onFicha={()=>setFicha(p)} onStatus={(id,s)=>{onUpdate({...p,status:s})}}/>)}
            </tbody>
          </table>
        </div>
      </div>
      {ficha&&<Ficha p={ficha} onClose={()=>setFicha(null)} onUpdate={p=>{onUpdate(p);setFicha(p)}}/>}
    </div>
  )
}

// ── ABA GERENCIAL ────────────────────────────────────────────────────────────
const META_MAIO = 85000

function AbaGerencial({parceiros,loading}:{parceiros:Parceiro[];loading:boolean}) {
  const meses=parceiros[0]?.meses_display||[]
  const mesAtual=meses[3]
  const totalProj=parceiros.reduce((a,p)=>a+p.proj_prod,0)
  const totalMesAtual=mesAtual?parceiros.reduce((a,p)=>a+(p.meses_display?.[3]?.prod||p.abr_prod||0),0):parceiros.reduce((a,p)=>a+p.abr_prod,0)
  const totalMesAnt=parceiros.reduce((a,p)=>a+(p.meses_display?.[2]?.prod||p.mar_prod||0),0)
  const comMedia=parceiros.filter(p=>p.media_2025)
  const totalMedia=comMedia.reduce((a,p)=>a+(p.media_2025||0),0)
  const vsMedia2025=totalMedia>0?((totalProj-totalMedia)/totalMedia*100):null
  const semStatus=parceiros.filter(p=>!p.status&&['Q1','Q2'].includes(p.quadrante)).length
  const emNeg=parceiros.filter(p=>p.status==='em_negociacao').length
  const pctMeta=Math.min(totalProj/META_MAIO*100,100)
  const corMeta=totalProj>=META_MAIO?'#15803d':totalProj>=META_MAIO*0.8?'#b45309':'#dc2626'

  const negParadas=parceiros.filter(p=>{
    if(p.status!=='em_negociacao')return false
    const obs=p.observacoes||[]
    if(!obs.length)return true
    return(Date.now()-new Date(obs[0].data).getTime())>5*86400000
  })

  const alertasVermelhos:{id:string;msg:string;sub:string}[]=[]
  const alertasAmarelos:{id:string;msg:string;sub:string}[]=[]

  negParadas.forEach(p=>alertasVermelhos.push({id:p.id,msg:`${p.nome} — Em Negociação parada há +5 dias`,sub:`${p.promotora}/${p.loja} · gap ${p.gap_prod>=0?'+':''}${brl(p.gap_prod)}`}))
  const q1SemStatus=parceiros.filter(p=>p.quadrante==='Q1'&&!p.status)
  if(q1SemStatus.length>0) alertasVermelhos.push({id:'q1',msg:`${q1SemStatus.length} parceiro${q1SemStatus.length>1?'s':''} Q1 sem tabulação`,sub:q1SemStatus.slice(0,3).map(p=>p.nome.split(' ')[0]).join(', ')+(q1SemStatus.length>3?'...':'')})
  const q2SemStatus=parceiros.filter(p=>p.quadrante==='Q2'&&!p.status)
  if(q2SemStatus.length>0) alertasAmarelos.push({id:'q2',msg:`${q2SemStatus.length} parceiro${q2SemStatus.length>1?'s':''} Q2 sem tabulação`,sub:q2SemStatus.slice(0,3).map(p=>p.nome.split(' ')[0]).join(', ')+(q2SemStatus.length>3?'...':'')})
  if(totalProj<META_MAIO*0.9) alertasAmarelos.push({id:'meta',msg:`Projeção ${pct(((totalProj-META_MAIO)/META_MAIO)*100)} da meta`,sub:`Faltam ${brl(META_MAIO-totalProj)} para atingir R$ ${(META_MAIO/1000).toFixed(0)}k`})

  const GESTORES=[
    {key:'VALERIA',label:'Valeria',initials:'VA',bg:'#dbeafe',color:'#0c447c'},
    {key:'PEDRO',  label:'Pedro',  initials:'PE',bg:'#fef3c7',color:'#78350f'},
    {key:'ERALDO', label:'Eraldo', initials:'ER',bg:'#dcfce7',color:'#14532d'},
  ]
  const statusCounts=(ps:Parceiro[])=>{
    const c:Record<string,number>={ativo:0,parou:0,migrou:0,venda_fraca:0,em_negociacao:0,lista_transmissao:0,sem_status:0}
    ps.forEach(p=>p.status?c[p.status]++:c.sem_status++); return c
  }
  const ultimaObs=(ps:Parceiro[])=>{
    const datas=ps.flatMap(p=>p.observacoes?.map(o=>o.data)||[])
    if(!datas.length)return null
    return new Date(Math.max(...datas.map(d=>new Date(d).getTime())))
  }
  const badge=(label:string,n:number,bg:string,color:string,border:string)=>(
    <span style={{fontSize:9,fontWeight:500,padding:'2px 6px',borderRadius:10,background:bg,color,border:`0.5px solid ${border}`,whiteSpace:'nowrap'}}>{n} {label}</span>
  )
  if(loading)return <div style={{textAlign:'center',padding:'60px',color:'#94a3b8'}}>Carregando...</div>

  const hoje=new Date()
  const nomes=['','jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
  const mesAtualNome=`${nomes[hoje.getMonth()+1]}/${String(hoje.getFullYear()).slice(2)}`

  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      <div style={{background:'#fff',borderRadius:12,padding:'14px 18px',border:'0.5px solid #e8ecf0',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:8}}>
          <div>
            <div style={{fontSize:9,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.06em',fontWeight:600,marginBottom:3}}>Meta {mesAtualNome.toUpperCase()} 2026</div>
            <div style={{display:'flex',alignItems:'baseline',gap:8}}>
              <span style={{fontSize:22,fontWeight:700,color:corMeta,letterSpacing:'-0.5px'}}>{brl(totalProj)}</span>
              <span style={{fontSize:13,color:'#94a3b8'}}>de {brl(META_MAIO)}</span>
              <span style={{fontSize:12,fontWeight:700,color:corMeta}}>({pctMeta.toFixed(0)}%)</span>
            </div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:10,color:'#64748b'}}>Faltam</div>
            <div style={{fontSize:16,fontWeight:700,color:totalProj>=META_MAIO?'#15803d':'#dc2626'}}>{totalProj>=META_MAIO?'✓ Meta atingida':brl(META_MAIO-totalProj)}</div>
          </div>
        </div>
        <div style={{height:10,background:'#f1f5f9',borderRadius:5,overflow:'hidden'}}>
          <div style={{height:10,borderRadius:5,width:`${pctMeta}%`,background:corMeta,transition:'width 0.5s'}}/>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10}}>
        {[
          {label:'Média 2025',val:brl(comMedia.length>0?totalMedia/comMedia.length:0),sub:`${comMedia.length} com histórico`,color:'#4f46e5',bg:'#ede9fe',icon:<TrendingUp style={{width:15,height:15}}/>},
          {label:'Mês anterior',val:brl(totalMesAnt),sub:'Fechado',color:'#07294a',bg:'#dbeafe',icon:<Users style={{width:15,height:15}}/>},
          {label:'Mês atual acum.',val:brl(totalMesAtual),sub:'Acumulado no período',color:'#0369a1',bg:'#e0f2fe',icon:<TrendingUp style={{width:15,height:15}}/>},
          {label:'Projeção',val:brl(totalProj),sub:vsMedia2025!==null?`${pct(vsMedia2025)} vs média 2025`:pct(totalMesAnt>0?(totalProj-totalMesAnt)/totalMesAnt*100:null),color:totalProj>=totalMesAnt?'#15803d':'#dc2626',bg:totalProj>=totalMesAnt?'#dcfce7':'#fee2e2',icon:<ArrowUpRight style={{width:15,height:15}}/>},
          {label:'Ação Necessária',val:String(semStatus),sub:`${emNeg} em negociação`,color:'#b45309',bg:'#fef3c7',icon:<AlertTriangle style={{width:15,height:15}}/>},
        ].map(k=>(
          <div key={k.label} style={{background:'#fff',borderRadius:12,padding:'14px 16px',border:'0.5px solid #e8ecf0',display:'flex',gap:12,alignItems:'flex-start',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
            <div style={{width:38,height:38,borderRadius:10,flexShrink:0,background:k.bg,color:k.color,display:'flex',alignItems:'center',justifyContent:'center'}}>{k.icon}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:9,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:3,fontWeight:600}}>{k.label}</div>
              <div style={{fontSize:20,fontWeight:700,color:k.label==='Projeção'||k.label==='Ação Necessária'?k.color:'#0f172a',lineHeight:1,letterSpacing:'-0.5px'}}>{k.val}</div>
              <div style={{fontSize:10,color:'#64748b',marginTop:3}}>{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
        {GESTORES.map(g=>{
          const gp=g.key==='PEDRO'?parceiros.filter(p=>p.loja==='PEDRO'||p.promotora==='GLM'):parceiros.filter(p=>p.loja===g.key)
          const gpNova=parceiros.filter(p=>p.loja===g.key)
          const proj=gp.reduce((a,p)=>a+p.proj_prod,0)
          const gap=gpNova.reduce((a,p)=>a+p.gap_prod,0)
          const mar=gpNova.reduce((a,p)=>a+(p.meses_display?.[1]?.prod||p.mar_prod||0),0)
          const cnt=statusCounts(gpNova)
          const tab=gpNova.filter(p=>p.status).length
          const pctTab=gpNova.length>0?tab/gpNova.length:0
          const alertasG=gpNova.filter(p=>['Q1','Q2'].includes(p.quadrante)&&!p.status).length
          const ultimaDt=ultimaObs(gpNova)
          const diffObs=ultimaDt?Math.floor((Date.now()-ultimaDt.getTime())/1000):null
          const obsStr=!ultimaDt?'Sem registro':diffObs&&diffObs<86400?`hoje ${ultimaDt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`:ultimaDt?`${ultimaDt.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})} ${ultimaDt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`:''
          const obsAtrasada=!ultimaDt||(diffObs&&diffObs>86400)
          const tendencia=mar>0?(proj-mar)/mar*100:null
          return (
            <div key={g.key} style={{background:'#fff',borderRadius:12,border:'0.5px solid #e8ecf0',overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
              <div style={{padding:'11px 14px 9px',borderBottom:'0.5px solid #f1f5f9',display:'flex',alignItems:'center',justifyContent:'space-between',background:obsAtrasada?'#fffbeb':'#fff'}}>
                <div style={{display:'flex',alignItems:'center',gap:9}}>
                  <div style={{width:32,height:32,borderRadius:'50%',background:g.bg,color:g.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700}}>{g.initials}</div>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:'#0f172a'}}>{g.label}</div>
                    <div style={{fontSize:9,color:obsAtrasada?'#b45309':'#94a3b8',fontWeight:obsAtrasada?600:400}}>
                      {obsAtrasada?'⚠ ':''}ult. obs: {obsStr}
                    </div>
                  </div>
                </div>
                <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:3}}>
                  {alertasG>0&&<span style={{fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:10,background:'#fee2e2',color:'#7f1d1d',border:'0.5px solid #fca5a5'}}>{alertasG} sem tab.</span>}
                  {tendencia!==null&&<span style={{fontSize:10,fontWeight:700,color:tendencia>=0?'#15803d':'#dc2626'}}>{tendencia>=0?'↑':'↓'} {Math.abs(tendencia).toFixed(0)}% vs ant.</span>}
                </div>
              </div>
              <div style={{padding:'10px 14px',display:'flex',flexDirection:'column',gap:5}}>
                <div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontSize:10,color:'#64748b'}}>Parceiros</span><span style={{fontSize:11,fontWeight:500}}>{g.key==='PEDRO'?`${parceiros.filter(p=>p.loja==='PEDRO').length} Nova + ${parceiros.filter(p=>p.promotora==='GLM').length} GLM`:gpNova.length}</span></div>
                <div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontSize:10,color:'#64748b'}}>Projeção</span><span style={{fontSize:13,fontWeight:700,color:proj>=mar?'#15803d':'#dc2626'}}>{brl(proj)}</span></div>
                <div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontSize:10,color:'#64748b'}}>Gap vs pro-rata</span><span style={{fontSize:11,fontWeight:600,color:gap>=0?'#15803d':'#dc2626'}}>{gap>=0?'+':''}{brl(gap)}</span></div>
                <div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontSize:10,color:'#64748b'}}>Tabulados</span><span style={{fontSize:11,fontWeight:500}}>{tab} / {gpNova.length}</span></div>
                <div style={{height:5,background:'#f1f5f9',borderRadius:3,marginTop:4,overflow:'hidden'}}>
                  <div style={{height:5,borderRadius:3,width:`${pctTab*100}%`,background:pctTab>0.6?'#15803d':pctTab>0.3?'#f59e0b':'#dc2626',transition:'width 0.4s'}}/>
                </div>
              </div>
              <div style={{padding:'8px 14px',borderTop:'0.5px solid #f1f5f9',display:'flex',gap:4,flexWrap:'wrap'}}>
                {cnt.ativo>0&&badge(`ativo${cnt.ativo>1?'s':''}`,cnt.ativo,'#dcfce7','#14532d','#86efac')}
                {cnt.em_negociacao>0&&badge('negociação',cnt.em_negociacao,'#ccfbf1','#134e4a','#5eead4')}
                {cnt.parou>0&&badge('parou',cnt.parou,'#fee2e2','#7f1d1d','#fca5a5')}
                {cnt.venda_fraca>0&&badge('venda fraca',cnt.venda_fraca,'#fef3c7','#78350f','#fcd34d')}
                {cnt.lista_transmissao>0&&badge('lista',cnt.lista_transmissao,'#ede9fe','#4c1d95','#c4b5fd')}
                {cnt.sem_status>0&&badge('sem status',cnt.sem_status,'#f3f4f6','#374151','#d1d5db')}
              </div>
            </div>
          )
        })}
      </div>

      {(alertasVermelhos.length>0||alertasAmarelos.length>0)&&(
        <div style={{background:'#fff',borderRadius:12,border:'0.5px solid #e8ecf0',padding:'12px 14px',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
          <div style={{fontSize:10,fontWeight:700,color:'#374151',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:10}}>Alertas</div>
          <div style={{display:'flex',flexDirection:'column',gap:5}}>
            {alertasVermelhos.map(a=>(
              <div key={a.id} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'9px 12px',borderRadius:8,background:'#fef2f2',border:'0.5px solid #fecaca'}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:'#dc2626',flexShrink:0,marginTop:3}}/>
                <div style={{flex:1}}><div style={{fontSize:11,fontWeight:600,color:'#7f1d1d'}}>{a.msg}</div><div style={{fontSize:10,color:'#94a3b8',marginTop:1}}>{a.sub}</div></div>
                <span style={{fontSize:9,fontWeight:700,color:'#dc2626',background:'#fee2e2',padding:'2px 7px',borderRadius:10,whiteSpace:'nowrap',flexShrink:0}}>🔴 Hoje</span>
              </div>
            ))}
            {alertasAmarelos.map(a=>(
              <div key={a.id} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'9px 12px',borderRadius:8,background:'#fffbeb',border:'0.5px solid #fde68a'}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:'#f59e0b',flexShrink:0,marginTop:3}}/>
                <div style={{flex:1}}><div style={{fontSize:11,fontWeight:600,color:'#78350f'}}>{a.msg}</div><div style={{fontSize:10,color:'#94a3b8',marginTop:1}}>{a.sub}</div></div>
                <span style={{fontSize:9,fontWeight:700,color:'#b45309',background:'#fef3c7',padding:'2px 7px',borderRadius:10,whiteSpace:'nowrap',flexShrink:0}}>🟡 Esta semana</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{background:'#fff',borderRadius:12,border:'0.5px solid #e8ecf0',padding:'12px 14px',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
        <div style={{fontSize:10,fontWeight:700,color:'#374151',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:10}}>CRM — {parceiros.length} parceiros</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:8}}>
          {[{key:'ativo',label:'Ativo',bg:'#dcfce7',color:'#14532d',border:'#86efac'},
            {key:'em_negociacao',label:'Em negociação',bg:'#ccfbf1',color:'#134e4a',border:'#5eead4'},
            {key:'parou',label:'Parou',bg:'#fee2e2',color:'#7f1d1d',border:'#fca5a5'},
            {key:'migrou',label:'Migrou',bg:'#dbeafe',color:'#1e3a5f',border:'#93c5fd'},
            {key:'lista_transmissao',label:'Lista transm.',bg:'#ede9fe',color:'#4c1d95',border:'#c4b5fd'},
            {key:'sem_status',label:'Sem status',bg:'#f3f4f6',color:'#374151',border:'#d1d5db'},
          ].map(s=>{
            const cnt={ativo:0,parou:0,migrou:0,venda_fraca:0,em_negociacao:0,lista_transmissao:0,sem_status:0}
            parceiros.forEach(p=>p.status?(cnt as any)[p.status]++:cnt.sem_status++)
            const n=(cnt as any)[s.key]||0
            return <div key={s.key} style={{borderRadius:9,padding:'10px 11px',background:s.bg,border:`0.5px solid ${s.border}`}}>
              <div style={{fontSize:9,fontWeight:600,color:s.color,marginBottom:4}}>{s.label}</div>
              <div style={{fontSize:22,fontWeight:700,color:s.color,lineHeight:1}}>{n}</div>
              <div style={{fontSize:9,color:s.color,opacity:0.7,marginTop:3}}>{parceiros.length>0?(n/parceiros.length*100).toFixed(0):0}%</div>
            </div>
          })}
        </div>
      </div>
    </div>
  )
}

// ── HELPERS UPLOAD ────────────────────────────────────────────────────────────
function parseBRL(v: any): number {
  if(!v)return 0
  return parseFloat(String(v).replace(/\./g,'').replace(',','.').replace(/[^\d.-]/g,''))||0
}
function normStr(s: string) {
  const rep:Record<string,string>={á:'a',à:'a',ã:'a',â:'a',é:'e',ê:'e',í:'i',ó:'o',ô:'o',õ:'o',ú:'u',ç:'c',Á:'A',À:'A',Ã:'A',Â:'A',É:'E',Ê:'E',Í:'I',Ó:'O',Ô:'O',Õ:'O',Ú:'U',Ç:'C'}
  let r=String(s); for(const [k,v] of Object.entries(rep))r=r.replaceAll(k,v)
  return r.replace(/\[.*?\]/g,'').replace(/\d{9,}/g,'').replace(/\s+/g,' ').trim().toUpperCase()
}
function calcS(mar:number,abr:number,fator:number):[string,number]{
  const proj=abr*fator
  if(mar===0&&abr>0)return['NOVO',proj]
  if(abr===0&&mar>0)return['ZEROU',0]
  if(mar===0)return['-',0]
  const v=(proj-mar)/mar*100
  return v>=20?['ACIMA',proj]:v<=-20?['ABAIXO',proj]:['ESTÁVEL',proj]
}
function qKey(sd:string,sp:string){
  if(sd==='ZEROU'&&sp==='ZEROU')return'Q1'
  if(['ZEROU','ABAIXO'].includes(sd)&&['ZEROU','ABAIXO'].includes(sp))return'Q2'
  if(['ACIMA','ESTÁVEL','NOVO'].includes(sd)&&['ZEROU','ABAIXO'].includes(sp))return'Q3'
  if(['ZEROU','ABAIXO'].includes(sd)&&['ACIMA','ESTÁVEL','NOVO'].includes(sp))return'Q4'
  if(['ACIMA','NOVO'].includes(sd)||['ACIMA','NOVO'].includes(sp))return'Q5'
  return'Q6'
}
function lojaKey(l:string){const u=l.toUpperCase();if(u.includes('VALERIA'))return'VALERIA';if(u.includes('PEDRO'))return'PEDRO';if(u.includes('ERALDO'))return'ERALDO';return l}

type FE={nome:string;status:'aguardando'|'lendo'|'ok'|'erro';rows?:number;data?:any[][];erro?:string}

// ── DROP ZONE ────────────────────────────────────────────────────────────────
function DropZ({label,desc,obrig,arq,onChange,onRemove}:{label:string;desc:string;obrig:boolean;arq?:FE;onChange:(f:FileList|null)=>void;onRemove:()=>void}) {
  const ref=useRef<HTMLInputElement>(null)
  const [drag,setDrag]=useState(false)
  const ok=arq?.status==='ok';const err=arq?.status==='erro';const lding=arq?.status==='lendo'
  return (
    <div style={{background:ok?'#f0fdf4':err?'#fef2f2':drag?'#eff6ff':'#fff',border:`0.5px solid ${ok?'#86efac':err?'#fca5a5':drag?'#07294a':'#e2e8f0'}`,borderRadius:9,padding:'11px 13px',cursor:arq?'default':'pointer',transition:'all 0.1s'}}
      onClick={()=>!arq&&ref.current?.click()}
      onDragOver={e=>{e.preventDefault();setDrag(true)}}
      onDragLeave={()=>setDrag(false)}
      onDrop={e=>{e.preventDefault();setDrag(false);onChange(e.dataTransfer.files)}}>
      <input ref={ref} type="file" accept=".xlsx,.xls" style={{display:'none'}} onChange={e=>onChange(e.target.files)}/>
      {ok?<div><div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div style={{display:'flex',alignItems:'center',gap:6}}><CheckCircle style={{width:13,height:13,color:'#16a34a',flexShrink:0}}/>
            <div><div style={{fontSize:11,fontWeight:600,color:'#0f172a'}}>{label}</div><div style={{fontSize:10,color:'#16a34a'}}>{arq!.nome}</div></div>
          </div>
          <button onClick={e=>{e.stopPropagation();onRemove()}} style={{border:'none',background:'none',cursor:'pointer',color:'#94a3b8',padding:1}}><X style={{width:12,height:12}}/></button>
        </div><div style={{fontSize:10,color:'#64748b',marginTop:2}}>{arq!.rows} linhas lidas</div>
      </div>
      :err?<div>
        <div style={{display:'flex',alignItems:'center',gap:6}}><AlertCircle style={{width:13,height:13,color:'#dc2626',flexShrink:0}}/><div style={{fontSize:11,fontWeight:600,color:'#dc2626'}}>{label}</div></div>
        <div style={{fontSize:10,color:'#dc2626',marginTop:2}}>{arq!.erro}</div>
        <button onClick={e=>{e.stopPropagation();onRemove()}} style={{fontSize:10,color:'#64748b',border:'none',background:'none',cursor:'pointer',marginTop:3,padding:0}}>Tentar novamente</button>
      </div>
      :lding?<div style={{display:'flex',alignItems:'center',gap:6}}><RefreshCw style={{width:12,height:12,color:'#07294a'}}/><span style={{fontSize:11,color:'#07294a'}}>Lendo...</span></div>
      :<div>
        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
          <FileSpreadsheet style={{width:13,height:13,color:'#94a3b8',flexShrink:0}}/>
          <div><div style={{fontSize:11,fontWeight:600,color:'#0f172a'}}>{label}{obrig&&<span style={{color:'#dc2626',marginLeft:2}}>*</span>}</div><div style={{fontSize:9,color:'#94a3b8'}}>{desc}</div></div>
        </div>
        <div style={{fontSize:10,color:'#94a3b8',textAlign:'center',marginTop:5,paddingTop:5,borderTop:'0.5px dashed #e2e8f0'}}>Arraste ou clique</div>
      </div>}
    </div>
  )
}

// ── ABA UPLOAD ───────────────────────────────────────────────────────────────
// Configuração mensal — SEM Base 2025 (fica no Redis)
const CFGS_MENSAL=[
  {id:'nova_dig', label:'Nova — Digitação', desc:'digitação_nova.xlsx', obrig:true},
  {id:'nova_prod',label:'Nova — Produção',  desc:'produção_nova.xlsx',  obrig:true},
  {id:'glm',      label:'GLM — Análise',    desc:'Export GLM',          obrig:false},
  {id:'lev_dig',  label:'Lev — Digitação',  desc:'digitação_lev.xlsx',  obrig:false},
  {id:'lev_prod', label:'Lev — Produção',   desc:'produção_lev.xlsx',   obrig:false},
]

function AbaUpload({onDadosAtualizados}:{onDadosAtualizados:()=>void}) {
  const hoje=new Date()

  // ── Seletor de mês real ──
  const [mesSel,  setMesSel  ]=useState(hoje.getMonth()+1)   // 1-12
  const [anoSel,  setAnoSel  ]=useState(hoje.getFullYear())
  const mesRef=`${String(mesSel).padStart(2,'0')}/${anoSel}`

  const nomesMes=['','Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  const anos=[hoje.getFullYear()-1,hoje.getFullYear(),hoje.getFullYear()+1]

  // ── Arquivos mensais ──
  const [arqs,setArqs]=useState<Record<string,FE>>({})
  const [du,setDu]=useState(20)

  // ── Processamento mensal ──
  const [processando,setProcessando]=useState(false)
  const [resultado,setResultado]=useState<{ok:boolean;msg:string}|null>(null)
  const [log,setLog]=useState<string[]>([])
  const addLog=(m:string)=>setLog(prev=>[...prev,m])

  const lerXLSX=async(file:File,sheetName?:string):Promise<any[][]>=>{
    const XLSX=(await import('xlsx')) as any
    const buf=await file.arrayBuffer()
    const wb=XLSX.read(buf,{type:'array'})
    const ws=sheetName?(wb.Sheets[sheetName]||wb.Sheets[wb.SheetNames[0]]):wb.Sheets[wb.SheetNames[0]]
    return XLSX.utils.sheet_to_json(ws,{header:1,defval:''})
  }

  const onDropMensal=useCallback(async(id:string,files:FileList|null)=>{
    if(!files?.length)return
    const file=files[0]
    setArqs(prev=>({...prev,[id]:{nome:file.name,status:'lendo'}}))
    try{const data=await lerXLSX(file);setArqs(prev=>({...prev,[id]:{nome:file.name,status:'ok',rows:data.length,data}}))}
    catch(e){setArqs(prev=>({...prev,[id]:{nome:file.name,status:'erro',erro:String(e)}}))}
  },[])

  const processar=async()=>{
    setProcessando(true);setLog([]);setResultado(null)
    addLog('Iniciando...')
    const fator=DU_TOT/du
    const parceiros:any[]=[]

    // Base 2025 embutida no código — sem upload, sem Redis
    const bIdx:Record<string,any>=BASE_2025
    addLog(`Base 2025: ${Object.keys(bIdx).length} registros (fixos)`)

    // Nova
    const nd=arqs['nova_dig']?.data;const np=arqs['nova_prod']?.data
    if(nd&&np){
      addLog('Nova: processando...')
      const dM:Record<number,[string,number,string]>={};const pM:Record<number,[string,number,string]>={}
      nd.slice(1).forEach((r:any[])=>{
        const nr=parseInt(r[0]);if(!isNaN(nr)){
          // r[5]=Produção Bruta (digitação do mês), r[7]=Prod.Líquida, r[8]=Valor Base (acumulado)
          const dig=parseFloat(r[5])||0
          dM[nr]=[String(r[3]||''),dig,String(r[1]||'')]
        }
      })
      np.slice(1).forEach((r:any[])=>{const nr=parseInt(r[0]);if(!isNaN(nr))pM[nr]=[String(r[3]||''),parseFloat(r[8])||0,String(r[1]||'')]})
      new Set([...Object.keys(dM).map(Number),...Object.keys(pM).map(Number)]).forEach(nr=>{
        const d=dM[nr];const p=pM[nr]
        const nome=d?.[0]||p?.[0]||'';const loja=lojaKey(d?.[2]||p?.[2]||'')
        const ad=d?.[1]||0;const ap=p?.[1]||0
        const[sd,pd_]=calcS(0,ad,fator);const[sp,pp]=calcS(0,ap,fator)
        parceiros.push({id:`nova-${nr}`,nr:String(nr),nome,loja,promotora:'Nova',du,fator:Math.round(fator*100)/100,
          mes_ref:mesRef,mar_dig:0,mar_prod:0,prorata_dig:0,prorata_prod:0,
          abr_dig:Math.round(ad*100)/100,abr_prod:Math.round(ap*100)/100,
          gap_dig:Math.round(ad*100)/100,gap_prod:Math.round(ap*100)/100,
          proj_dig:Math.round(pd_*100)/100,proj_prod:Math.round(pp*100)/100,
          var_dig:null,var_prod:null,st_dig:sd,st_prod:sp,quadrante:qKey(sd,sp),
          media_2025:null,pico_2025:null,pico_mes:null,perfil_2025:null,total_2025:null,meses_ativos:null,status:null,observacoes:[]})
      })
      addLog(`Nova: ${parceiros.filter((p:any)=>p.promotora==='Nova').length} parceiros`)
    }

    // GLM
    const glm=arqs['glm']?.data
    if(glm){
      addLog('GLM: processando...')
      glm.slice(3).filter((r:any[])=>r[0]&&!String(r[0]).toLowerCase().includes('total')).forEach((r:any[])=>{
        const par=String(r[0]||'');const cm=par.match(/^(\d+)/);if(!cm)return
        const cod=cm[1];const nome=par.replace(/^\d+\s*-\s*/,'').trim()
        const ap=parseFloat(r[1])||0;const ad=parseFloat(r[6])||0
        const[sd,pd_]=calcS(0,ad,fator);const[sp,pp]=calcS(0,ap,fator)
        parceiros.push({id:`glm-${cod}`,nr:cod,nome,loja:'GLM',promotora:'GLM',du,fator:Math.round(fator*100)/100,
          mes_ref:mesRef,mar_dig:0,mar_prod:0,prorata_dig:0,prorata_prod:0,
          abr_dig:Math.round(ad*100)/100,abr_prod:Math.round(ap*100)/100,
          gap_dig:Math.round(ad*100)/100,gap_prod:Math.round(ap*100)/100,
          proj_dig:Math.round(pd_*100)/100,proj_prod:Math.round(pp*100)/100,
          var_dig:null,var_prod:null,st_dig:sd,st_prod:sp,quadrante:qKey(sd,sp),
          media_2025:null,pico_2025:null,pico_mes:null,perfil_2025:null,total_2025:null,meses_ativos:null,status:null,observacoes:[]})
      })
    }

    // Enriquecer com Base 2025 do Redis
    if(Object.keys(bIdx).length>0){
      addLog('Enriquecendo com Base 2025...')
      let matched=0
      parceiros.forEach((p:any)=>{
        const n=normStr(p.nome);let hit=bIdx[n]
        if(!hit){
          const ws=n.split(' ').filter((w:string)=>w.length>4);let best:any|null=null;let bs=0
          Object.entries(bIdx).forEach(([k,v])=>{const sc=ws.filter((w:string)=>k.includes(w)).length;if(sc>=2&&sc>bs){best=v;bs=sc}})
          if(best)hit=best
        }
        if(hit){p.media_2025=hit.media||null;p.pico_2025=hit.pico||null;p.pico_mes=hit.pico_mes||null;p.perfil_2025=hit.perfil||null;p.total_2025=hit.total||null;p.meses_ativos=hit.meses_ativos||null;matched++}
      })
      addLog(`Base 2025: ${matched}/${parceiros.length} enriquecidos`)
    }

    if(parceiros.length===0){setResultado({ok:false,msg:'Adicione pelo menos Nova Digitação e Nova Produção.'});setProcessando(false);return}
    addLog(`Salvando ${parceiros.length} parceiros em ${mesRef}...`)
    try{
      const res=await fetch('/api/parceiros',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({parceiros_bulk:parceiros,mes_ref:mesRef})})
      const data=await res.json()
      if(data.ok){addLog(`✓ ${data.count} parceiros salvos em ${mesRef}!`);setResultado({ok:true,msg:`${data.count} parceiros salvos em ${mesRef}!`});onDadosAtualizados()}
      else throw new Error(JSON.stringify(data))
    }catch(e){addLog(`✗ Erro: ${e}`);setResultado({ok:false,msg:`Erro: ${e}`})}
    setProcessando(false)
  }

  const temObrig=arqs['nova_dig']?.status==='ok'&&arqs['nova_prod']?.status==='ok'

  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>

      {/* ── SEÇÃO UPLOAD MENSAL ── */}
      <div style={{background:'#fff',borderRadius:12,border:'0.5px solid #e8ecf0',padding:'14px 16px'}}>
        <div style={{fontSize:13,fontWeight:700,color:'#0f172a',marginBottom:10}}>Atualizar dados mensais</div>

        {/* Seletor de mês REAL */}
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12,flexWrap:'wrap'}}>
          <span style={{fontSize:11,color:'#64748b',fontWeight:600}}>Mês de referência:</span>
          <select value={mesSel} onChange={e=>setMesSel(Number(e.target.value))}
            style={{padding:'6px 10px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:12,color:'#0f172a',background:'#fff',cursor:'pointer',fontWeight:600}}>
            {nomesMes.slice(1).map((n,i)=><option key={i+1} value={i+1}>{n}</option>)}
          </select>
          <select value={anoSel} onChange={e=>setAnoSel(Number(e.target.value))}
            style={{padding:'6px 10px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:12,color:'#0f172a',background:'#fff',cursor:'pointer',fontWeight:600}}>
            {anos.map(a=><option key={a} value={a}>{a}</option>)}
          </select>
          <span style={{fontSize:12,fontWeight:700,padding:'4px 12px',borderRadius:20,background:'#eff6ff',color:'#07294a',border:'1px solid #bfdbfe'}}>
            {mesRef}
          </span>
        </div>

        {/* Dias úteis */}
        <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',marginBottom:12}}>
          <span style={{fontSize:11,color:'#64748b',fontWeight:500}}>Dias úteis:</span>
          <div style={{display:'flex',gap:3,flexWrap:'wrap'}}>
            {[7,8,9,10,11,12,13,14,15,16,17,18,19,20,21].map(n=>(
              <button key={n} onClick={()=>setDu(n)} style={{width:30,height:28,borderRadius:5,border:`0.5px solid ${du===n?'#07294a':'#e2e8f0'}`,background:du===n?'#07294a':'#fff',color:du===n?'#fff':'#374151',fontSize:11,cursor:'pointer',fontWeight:du===n?600:400}}>{n}</button>
            ))}
          </div>
          <span style={{fontSize:11,color:'#94a3b8'}}>→ fator {(DU_TOT/du).toFixed(2)}×</span>
        </div>

        {/* Arquivos mensais */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:9,marginBottom:12}}>
          {CFGS_MENSAL.map(cfg=><DropZ key={cfg.id} label={cfg.label} desc={cfg.desc} obrig={cfg.obrig}
            arq={arqs[cfg.id]} onChange={files=>onDropMensal(cfg.id,files)}
            onRemove={()=>setArqs(prev=>{const n={...prev};delete n[cfg.id];return n})}/>)}
        </div>

        {/* Botão processar */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:log.length?12:0}}>
          <div style={{fontSize:12,color:'#64748b'}}>
            {!temObrig
              ?<span style={{color:'#d97706'}}>⚠ Adicione Nova Digitação e Produção</span>
              :`${Object.values(arqs).filter(a=>a.status==='ok').length} arquivo(s) · ${du}du · fator ${(DU_TOT/du).toFixed(2)}× · ref ${mesRef}`}
          </div>
          <button onClick={processar} disabled={!temObrig||processando}
            style={{display:'flex',alignItems:'center',gap:6,padding:'9px 18px',borderRadius:8,border:'none',
              background:temObrig&&!processando?'#07294a':'#e2e8f0',
              color:temObrig&&!processando?'#fff':'#94a3b8',
              cursor:temObrig&&!processando?'pointer':'default',fontSize:13,fontWeight:600}}>
            {processando?<><RefreshCw style={{width:13,height:13}}/> Processando...</>:<><Upload style={{width:13,height:13}}/> Atualizar sistema</>}
          </button>
        </div>

        {log.length>0&&<div style={{background:'#f8fafc',borderRadius:7,border:'0.5px solid #e2e8f0',padding:'10px 12px',fontSize:11,fontFamily:'monospace',lineHeight:1.9,color:'#374151',maxHeight:160,overflowY:'auto'}}>{log.map((l,i)=><div key={i}>{l}</div>)}</div>}
        {resultado&&<div style={{marginTop:10,padding:'10px 12px',borderRadius:8,display:'flex',alignItems:'center',gap:8,background:resultado.ok?'#f0fdf4':'#fef2f2',border:`0.5px solid ${resultado.ok?'#bbf7d0':'#fecaca'}`}}>
          {resultado.ok?<CheckCircle style={{width:14,height:14,color:'#16a34a',flexShrink:0}}/>:<AlertCircle style={{width:14,height:14,color:'#dc2626',flexShrink:0}}/>}
          <div style={{fontSize:12,fontWeight:600,color:resultado.ok?'#15803d':'#dc2626'}}>{resultado.msg}</div>
        </div>}
      </div>
    </div>
  )
}

// ── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────
const TABS: {id:Tab;label:string}[] = [
  {id:'gerencial',label:'Gerencial'},
  {id:'todos',label:'Todos'},
  {id:'VALERIA',label:'Valeria'},
  {id:'PEDRO',label:'Pedro'},
  {id:'ERALDO',label:'Eraldo'},
  {id:'upload',label:'Upload'},
]

export default function Page() {
  const [tab,setTab]=useState<Tab>('gerencial')
  const [parceiros,setParceiros]=useState<Parceiro[]>([])
  const [loading,setLoading]=useState(true)
  const load=useCallback(async()=>{setLoading(true);const r=await fetch('/api/parceiros');setParceiros(await r.json());setLoading(false)},[])
  useEffect(()=>{load()},[load])
  const update=(p:Parceiro)=>setParceiros(prev=>prev.map(x=>x.id===p.id?p:x))
  return (
    <div style={{minHeight:'100vh',background:'#f0f2f5',fontFamily:'var(--font-sans,system-ui)'}}>
      <div style={{background:'#07294a',color:'#fff',padding:'0 20px',height:56,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:50,boxShadow:'0 4px 16px rgba(0,0,0,0.25)'}}>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:34,height:34,borderRadius:8,background:'#fff',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
                <path d="M6 32V14l10 10 4-4V32" stroke="#07294a" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <path d="M20 20l4 4 10-10V32" stroke="#07294a" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </div>
            <div>
              <div style={{fontSize:15,fontWeight:700,letterSpacing:'-0.3px',lineHeight:1.1}}>Melhor Crédito</div>
              <div style={{fontSize:8.5,color:'#7cc8fb',letterSpacing:'0.12em',fontWeight:700,textTransform:'uppercase'}}>Painel de Produção</div>
            </div>
          </div>
          <div style={{width:1,height:28,background:'rgba(255,255,255,0.15)'}}/>
          <div style={{display:'flex',gap:2}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)}
                style={{padding:'6px 13px',fontSize:11.5,borderRadius:6,border:'none',cursor:'pointer',fontWeight:tab===t.id?600:400,background:tab===t.id?'rgba(255,255,255,0.18)':'transparent',color:tab===t.id?'#fff':'rgba(255,255,255,0.6)',transition:'all 0.15s'}}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{fontSize:10,color:'rgba(255,255,255,0.4)'}}>{new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'})}</div>
          <button onClick={load} style={{display:'flex',alignItems:'center',gap:5,padding:'6px 13px',borderRadius:7,background:'rgba(255,255,255,0.1)',border:'0.5px solid rgba(255,255,255,0.18)',color:'#fff',cursor:'pointer',fontSize:11,fontWeight:500}}>
            <RefreshCw style={{width:12,height:12}}/> Atualizar
          </button>
        </div>
      </div>
      <div style={{maxWidth:1600,margin:'0 auto',padding:'16px 20px'}}>
        {tab==='gerencial' && <AbaGerencial parceiros={parceiros} loading={loading}/>}
        {tab==='todos'     && <AbaTabela parceiros={parceiros} loading={loading} onUpdate={update}/>}
        {tab==='VALERIA'   && <AbaTabela parceiros={parceiros} lojaFiltro="VALERIA" loading={loading} onUpdate={update}/>}
        {tab==='PEDRO'     && <AbaTabela parceiros={parceiros} lojaFiltro="PEDRO" loading={loading} onUpdate={update}/>}
        {tab==='ERALDO'    && <AbaTabela parceiros={parceiros} lojaFiltro="ERALDO" loading={loading} onUpdate={update}/>}
        {tab==='upload'    && <AbaUpload onDadosAtualizados={load}/>}
        <div style={{marginTop:10,fontSize:11,color:'#94a3b8',textAlign:'center'}}>Melhor Crédito · CRM · {new Date().getFullYear()}</div>
      </div>
    </div>
  )
}
