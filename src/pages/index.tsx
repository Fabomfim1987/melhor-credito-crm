import { useState, useMemo } from 'react'
import Head from 'next/head'
import { parceiros, statusConfig, perfilConfig, empresaConfig, salaConfig, formatBRL, perfilNorm, type Parceiro, type Status, type Perfil } from '@/data/parceiros'

const MESES = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ']
const STATUS_LIST: Status[] = ['Ativo','Parou','Migrou','Venda Fraca','Em Negociação','Lista Transmissão']
const PERFIL_LIST: Perfil[] = ['SÓLIDO','CONFIÁVEL','OPORTUNISTA','NÃO CONFIÁVEL','NOVO']

function Ficha({ p, onClose, onUpdate }: { p: Parceiro; onClose: () => void; onUpdate: (id: number, field: string, val: string) => void }) {
  const pico_pct = p.pico_2025 > 0 ? (p.prod_marco / p.pico_2025 * 100).toFixed(0) : null
  const vs_media = p.media_2025 > 0 ? (p.prod_marco / p.media_2025 * 100).toFixed(0) : null
  const cfg = perfilConfig[perfilNorm(p.perfil)]
  const sc = statusConfig[p.status]
  const ec = empresaConfig[p.empresa] || { cor: '#07294a', label: p.empresa }
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={onClose}>
      <div style={{background:'#fff',borderRadius:16,width:'100%',maxWidth:600,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}} onClick={e=>e.stopPropagation()}>
        <div style={{background:ec.cor,borderRadius:'16px 16px 0 0',padding:'20px 24px',color:'#fff'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div>
              <div style={{fontSize:11,opacity:0.75,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>{ec.label}{p.sala!==p.empresa?` · Sala ${salaConfig[p.sala]?.label??p.sala}`:''}</div>
              <div style={{fontSize:16,fontWeight:700,lineHeight:1.3}}>{p.nome}</div>
            </div>
            <button onClick={onClose} style={{background:'rgba(255,255,255,0.2)',border:'none',color:'#fff',borderRadius:8,padding:'4px 10px',cursor:'pointer',fontSize:18}}>×</button>
          </div>
        </div>
        <div style={{padding:24}}>
          <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:20}}>
            <span style={{background:sc.bg,color:sc.text,borderRadius:20,padding:'4px 12px',fontSize:12,fontWeight:600,display:'flex',alignItems:'center',gap:6}}>
              <span style={{width:7,height:7,borderRadius:'50%',background:sc.dot,display:'inline-block'}}/>{p.status}
            </span>
            <span style={{background:cfg.bg,color:cfg.text,borderRadius:20,padding:'4px 12px',fontSize:12,fontWeight:600}}>{perfilNorm(p.perfil)}</span>
            {p.meses_ativos>0&&<span style={{background:'#f1f5f9',color:'#475569',borderRadius:20,padding:'4px 12px',fontSize:12}}>{p.meses_ativos} meses ativos em 2025</span>}
          </div>
          {p.media_2025>0&&(
            <div style={{background:'#f8fafc',borderRadius:12,padding:16,marginBottom:16,border:'1px solid #e2e8f0'}}>
              <div style={{fontSize:11,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:12}}>Histórico 2025</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:12}}>
                <div><div style={{fontSize:10,color:'#94a3b8'}}>Média mensal</div><div style={{fontSize:15,fontWeight:700,color:'#07294a'}}>{formatBRL(p.media_2025)}</div></div>
                <div><div style={{fontSize:10,color:'#94a3b8'}}>Pico ({p.pico_mes})</div><div style={{fontSize:15,fontWeight:700,color:'#1A5276'}}>{formatBRL(p.pico_2025)}</div></div>
                <div><div style={{fontSize:10,color:'#94a3b8'}}>Dez/2025</div><div style={{fontSize:15,fontWeight:700,color:'#475569'}}>{formatBRL(p.dez_2025)}</div></div>
              </div>
              {Object.keys(p.hist).length>0&&(
                <div>
                  <div style={{fontSize:10,color:'#94a3b8',marginBottom:6}}>Produção mensal 2025</div>
                  <div style={{display:'flex',gap:3,alignItems:'flex-end',height:48}}>
                    {MESES.map(m=>{
                      const v=p.hist[m]||0
                      const maxV=Math.max(...Object.values(p.hist),1)
                      const h=v>0?Math.max(4,Math.round((v/maxV)*44)):2
                      return(
                        <div key={m} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                          <div title={`${m}: ${formatBRL(v)}`} style={{width:'100%',height:h,background:v===p.pico_2025?'#1A5276':v>0?'#2E75B6':'#e2e8f0',borderRadius:2}}/>
                          <div style={{fontSize:8,color:'#94a3b8'}}>{m[0]}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              <div style={{marginTop:12,padding:'8px 12px',background:'#EBF5FB',borderRadius:8,fontSize:12,color:'#1A5276'}}>
                {vs_media&&<span>Março = <strong>{vs_media}%</strong> da média 2025</span>}
                {pico_pct&&<span style={{marginLeft:12}}>· <strong>{pico_pct}%</strong> do pico</span>}
                {Number(vs_media)>=100&&<span style={{marginLeft:8,color:'#375623',fontWeight:600}}> ▲ Acima da média</span>}
                {Number(vs_media)>0&&Number(vs_media)<70&&<span style={{marginLeft:8,color:'#843C0C',fontWeight:600}}> ▼ Abaixo da média</span>}
              </div>
            </div>
          )}
          <div style={{background:'#f8fafc',borderRadius:12,padding:16,marginBottom:16,border:'1px solid #e2e8f0'}}>
            <div style={{fontSize:11,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:12}}>Março 2026</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
              <div><div style={{fontSize:10,color:'#94a3b8'}}>Produção (VB)</div><div style={{fontSize:15,fontWeight:700,color:'#07294a'}}>{formatBRL(p.prod_marco)}</div></div>
              <div><div style={{fontSize:10,color:'#94a3b8'}}>Prod. Paga</div><div style={{fontSize:15,fontWeight:700,color:'#375623'}}>{formatBRL(p.prod_paga_marco)}</div></div>
              <div><div style={{fontSize:10,color:'#94a3b8'}}>Contratos</div><div style={{fontSize:15,fontWeight:700,color:'#475569'}}>{p.contratos_marco||'—'}</div></div>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
            <div>
              <label style={{fontSize:11,color:'#64748b',fontWeight:600,display:'block',marginBottom:4}}>STATUS CRM</label>
              <select value={p.status} onChange={e=>onUpdate(p.id,'status',e.target.value)} style={{width:'100%',padding:'8px 10px',borderRadius:8,border:'1px solid #e2e8f0',fontSize:13,background:'#fff',cursor:'pointer'}}>
                {STATUS_LIST.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:11,color:'#64748b',fontWeight:600,display:'block',marginBottom:4}}>QUADRANTE</label>
              <select value={p.quadrante} onChange={e=>onUpdate(p.id,'quadrante',e.target.value)} style={{width:'100%',padding:'8px 10px',borderRadius:8,border:'1px solid #e2e8f0',fontSize:13,background:'#fff',cursor:'pointer'}}>
                {['','Q1 — Alerta Máximo','Q2 — Alerta','Q3 — Dig OK/Prod Baixa','Q4 — Conv. Residual','Q5 — Saudável','Q6 — Sem Movimento'].map(q=><option key={q}>{q}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{fontSize:11,color:'#64748b',fontWeight:600,display:'block',marginBottom:4}}>OBSERVAÇÃO</label>
            <textarea value={p.obs} onChange={e=>onUpdate(p.id,'obs',e.target.value)} placeholder="Adicione uma observação..." rows={2}
              style={{width:'100%',padding:'8px 10px',borderRadius:8,border:'1px solid #e2e8f0',fontSize:13,resize:'vertical',fontFamily:'inherit'}}/>
          </div>
        </div>
      </div>
    </div>
  )
}

function Linha({ p, onFicha }: { p: Parceiro; onFicha: () => void }) {
  const sc = statusConfig[p.status]
  const pc = perfilConfig[perfilNorm(p.perfil)]
  const vs_media = p.media_2025>0?(p.prod_marco/p.media_2025*100).toFixed(0):null
  const isAlerta = p.status==='Parou'||p.status==='Migrou'
  return (
    <tr onClick={onFicha} style={{cursor:'pointer',borderBottom:'1px solid #f1f5f9',background:isAlerta?'#fffbeb':undefined}}
      onMouseEnter={e=>(e.currentTarget.style.background='#f0f9ff')}
      onMouseLeave={e=>(e.currentTarget.style.background=isAlerta?'#fffbeb':'')}>
      <td style={{padding:'10px 12px',fontSize:13,fontWeight:500,color:'#1e293b',maxWidth:200}}>
        <div style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.nome}</div>
        {p.obs&&<div style={{fontSize:10,color:'#94a3b8',marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.obs}</div>}
      </td>
      <td style={{padding:'10px 12px'}}>
        <span style={{background:sc.bg,color:sc.text,borderRadius:20,padding:'3px 9px',fontSize:11,fontWeight:600,display:'flex',alignItems:'center',gap:5,width:'fit-content'}}>
          <span style={{width:6,height:6,borderRadius:'50%',background:sc.dot,display:'inline-block',flexShrink:0}}/>{p.status}
        </span>
      </td>
      <td style={{padding:'10px 12px'}}>
        <span style={{background:pc.bg,color:pc.text,borderRadius:4,padding:'3px 8px',fontSize:11,fontWeight:600}}>{perfilNorm(p.perfil)}</span>
      </td>
      <td style={{padding:'10px 12px',textAlign:'right',fontSize:13,fontWeight:700,color:'#07294a'}}>{formatBRL(p.prod_marco)}</td>
      <td style={{padding:'10px 12px',textAlign:'right',fontSize:12,color:'#475569'}}>{formatBRL(p.media_2025)}</td>
      <td style={{padding:'10px 12px',textAlign:'right',fontSize:12,color:'#1A5276'}}>{formatBRL(p.pico_2025)}</td>
      <td style={{padding:'10px 12px',textAlign:'right',fontSize:12}}>
        {vs_media?<span style={{color:Number(vs_media)>=100?'#375623':Number(vs_media)<70?'#843C0C':'#7F6000',fontWeight:600}}>{vs_media}%</span>:'—'}
      </td>
      <td style={{padding:'10px 12px',textAlign:'right',fontSize:12,color:'#475569'}}>{p.contratos_marco||'—'}</td>
    </tr>
  )
}

export default function Home() {
  const [lista,setLista]=useState<Parceiro[]>(parceiros.map(p=>({...p,status:p.status as Status})))
  const [ficha,setFicha]=useState<Parceiro|null>(null)
  const [filtroEmpresa,setFiltroEmpresa]=useState('')
  const [filtroSala,setFiltroSala]=useState('')
  const [filtroStatus,setFiltroStatus]=useState('')
  const [filtroPerfil,setFiltroPerfil]=useState('')
  const [busca,setBusca]=useState('')
  const [ordenar,setOrdenar]=useState<'prod_marco'|'media_2025'|'pico_2025'|'nome'>('prod_marco')

  const updateField=(id:number,field:string,val:string)=>{
    setLista(prev=>prev.map(p=>p.id===id?{...p,[field]:val}as Parceiro:p))
    setFicha(prev=>prev&&prev.id===id?{...prev,[field]:val}as Parceiro:prev)
  }

  const filtrados=useMemo(()=>lista
    .filter(p=>!filtroEmpresa||p.empresa===filtroEmpresa)
    .filter(p=>!filtroSala||p.sala===filtroSala)
    .filter(p=>!filtroStatus||p.status===filtroStatus)
    .filter(p=>!filtroPerfil||perfilNorm(p.perfil)===filtroPerfil)
    .filter(p=>!busca||p.nome.toLowerCase().includes(busca.toLowerCase()))
    .sort((a,b)=>ordenar==='nome'?a.nome.localeCompare(b.nome):(b[ordenar]as number)-(a[ordenar]as number))
  ,[lista,filtroEmpresa,filtroSala,filtroStatus,filtroPerfil,busca,ordenar])

  const totalProd=filtrados.reduce((s,p)=>s+p.prod_marco,0)
  const totalMedia=filtrados.reduce((s,p)=>s+p.media_2025,0)
  const ativos=filtrados.filter(p=>p.status==='Ativo').length
  const alerts=filtrados.filter(p=>p.status==='Parou'||p.status==='Migrou').length
  const comHist=filtrados.filter(p=>p.media_2025>0).length

  const salasDisponiveis=filtroEmpresa==='NOVA'
    ?[['PEDRO','Pedro'],['VALERIA','Valéria'],['ERALDO','Eraldo']]
    :filtroEmpresa==='GLM'?[['GLM','GLM']]
    :filtroEmpresa==='LEV'?[['LEV','Lev']]
    :[['PEDRO','Pedro'],['VALERIA','Valéria'],['ERALDO','Eraldo'],['GLM','GLM'],['LEV','Lev']]

  const sel:React.CSSProperties={padding:'7px 10px',borderRadius:8,border:'1px solid #e2e8f0',fontSize:13,background:'#fff',cursor:'pointer',outline:'none'}

  return(
    <>
      <Head><title>CRM — Melhor Crédito</title><meta name="viewport" content="width=device-width, initial-scale=1"/></Head>
      <header style={{background:'#07294a',padding:'0 24px',height:54,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:40}}>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <span style={{color:'#fff',fontWeight:700,fontSize:15}}>Melhor Crédito</span>
          <span style={{color:'#7cc8fb',fontSize:10,textTransform:'uppercase',letterSpacing:'0.1em'}}>CRM · Nova + GLM + Lev</span>
        </div>
        <div style={{fontSize:11,color:'#7cc8fb'}}>{lista.length} parceiros · Março 2026</div>
      </header>
      <main style={{maxWidth:1400,margin:'0 auto',padding:'20px 16px'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:20}}>
          {[
            {label:'Produção Março',value:formatBRL(totalProd),cor:'#07294a'},
            {label:'Média 2025 (filtro)',value:formatBRL(totalMedia),cor:'#1A5276'},
            {label:'Ativos',value:String(ativos),cor:'#16a34a'},
            {label:'Parou / Migrou',value:String(alerts),cor:'#dc2626'},
            {label:'Com histórico 2025',value:`${comHist}/${filtrados.length}`,cor:'#7c3aed'},
          ].map(k=>(
            <div key={k.label} style={{background:'#fff',borderRadius:12,padding:'14px 16px',border:'1px solid #e8ecf0'}}>
              <div style={{fontSize:10,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:4}}>{k.label}</div>
              <div style={{fontSize:20,fontWeight:700,color:k.cor}}>{k.value}</div>
            </div>
          ))}
        </div>
        <div style={{background:'#fff',borderRadius:12,padding:'14px 16px',marginBottom:16,border:'1px solid #e8ecf0',display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
          <input placeholder="Buscar parceiro..." value={busca} onChange={e=>setBusca(e.target.value)}
            style={{padding:'7px 12px',borderRadius:8,border:'1px solid #e2e8f0',fontSize:13,minWidth:200,outline:'none'}}/>
          <select value={filtroEmpresa} onChange={e=>{setFiltroEmpresa(e.target.value);setFiltroSala('')}} style={sel}>
            <option value="">Todas as promotoras</option>
            <option value="NOVA">Nova Promotora</option>
            <option value="GLM">GLM</option>
            <option value="LEV">Lev</option>
          </select>
          <select value={filtroSala} onChange={e=>setFiltroSala(e.target.value)} style={sel}>
            <option value="">Todas as salas</option>
            {salasDisponiveis.map(([k,l])=><option key={k} value={k}>{l}</option>)}
          </select>
          <select value={filtroStatus} onChange={e=>setFiltroStatus(e.target.value)} style={sel}>
            <option value="">Todos os status</option>
            {STATUS_LIST.map(s=><option key={s}>{s}</option>)}
          </select>
          <select value={filtroPerfil} onChange={e=>setFiltroPerfil(e.target.value)} style={sel}>
            <option value="">Todos os perfis</option>
            {PERFIL_LIST.map(p=><option key={p}>{p}</option>)}
          </select>
          <select value={ordenar} onChange={e=>setOrdenar(e.target.value as typeof ordenar)} style={sel}>
            <option value="prod_marco">↓ Março 2026</option>
            <option value="media_2025">↓ Média 2025</option>
            <option value="pico_2025">↓ Pico 2025</option>
            <option value="nome">A → Z</option>
          </select>
          {(filtroEmpresa||filtroSala||filtroStatus||filtroPerfil||busca)&&(
            <button onClick={()=>{setFiltroEmpresa('');setFiltroSala('');setFiltroStatus('');setFiltroPerfil('');setBusca('')}}
              style={{padding:'7px 12px',borderRadius:8,border:'1px solid #e2e8f0',fontSize:12,cursor:'pointer',color:'#64748b',background:'#f8fafc'}}>
              Limpar filtros
            </button>
          )}
          <span style={{marginLeft:'auto',fontSize:12,color:'#94a3b8'}}>{filtrados.length} parceiros</span>
        </div>
        <div style={{background:'#fff',borderRadius:12,border:'1px solid #e8ecf0',overflow:'hidden'}}>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:'#f8fafc',borderBottom:'2px solid #e2e8f0'}}>
                  {[['Parceiro','left'],['Status','left'],['Perfil 2025','left'],['Março 2026','right'],['Média 2025','right'],['Pico 2025','right'],['% vs Média','right'],['Contratos','right']].map(([h,a])=>(
                    <th key={h} style={{padding:'10px 12px',textAlign:a as 'left'|'right',fontSize:10,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.05em',whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.length===0
                  ?<tr><td colSpan={8} style={{padding:'48px',textAlign:'center',color:'#94a3b8'}}>Nenhum parceiro encontrado.</td></tr>
                  :filtrados.map(p=><Linha key={p.id} p={p} onFicha={()=>setFicha(p)}/>)
                }
              </tbody>
            </table>
          </div>
        </div>
        <div style={{marginTop:10,fontSize:11,color:'#94a3b8',textAlign:'center'}}>
          Melhor Crédito · Nova + GLM + Lev · Histórico 2025 + Março 2026 · Clique no parceiro para ver a ficha completa
        </div>
      </main>
      {ficha&&<Ficha p={ficha} onClose={()=>setFicha(null)} onUpdate={updateField}/>}
    </>
  )
}
