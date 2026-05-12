'use client'
import { useState, useRef, useCallback } from 'react'
import { Upload, CheckCircle, AlertCircle, FileSpreadsheet, RefreshCw, ArrowLeft, X } from 'lucide-react'

const DU_TOT = 22

function calcStatus(mar: number, abr: number, fator: number, aus = false): [string, number] {
  if (aus && mar > 0) return ['ZEROU', 0]
  const proj = abr * fator
  if (mar === 0 && abr > 0) return ['NOVO', proj]
  if (abr === 0 && mar > 0) return ['ZEROU', 0]
  if (mar === 0) return ['-', 0]
  const v = proj !== 0 && mar !== 0 ? (proj - mar) / mar * 100 : null
  if (v === null) return ['-', 0]
  return v >= 20 ? ['ACIMA', proj] : v <= -20 ? ['ABAIXO', proj] : ['ESTÁVEL', proj]
}

function quad(sd: string, sp: string) {
  if (sd === 'ZEROU' && sp === 'ZEROU') return 'Q1'
  if (['ZEROU','ABAIXO'].includes(sd) && ['ZEROU','ABAIXO'].includes(sp)) return 'Q2'
  if (['ACIMA','ESTÁVEL','NOVO'].includes(sd) && ['ZEROU','ABAIXO'].includes(sp)) return 'Q3'
  if (['ZEROU','ABAIXO'].includes(sd) && ['ACIMA','ESTÁVEL','NOVO'].includes(sp)) return 'Q4'
  if (['ACIMA','NOVO'].includes(sd) || ['ACIMA','NOVO'].includes(sp)) return 'Q5'
  return 'Q6'
}

function norm(s: string) {
  if (!s) return ''
  const rep: Record<string,string> = {á:'a',à:'a',ã:'a',â:'a',é:'e',ê:'e',í:'i',ó:'o',ô:'o',õ:'o',ú:'u',ç:'c',Á:'A',À:'A',Ã:'A',Â:'A',É:'E',Ê:'E',Í:'I',Ó:'O',Ô:'O',Õ:'O',Ú:'U',Ç:'C'}
  let r = String(s)
  for (const [k,v] of Object.entries(rep)) r = r.replaceAll(k, v)
  return r.replace(/\[.*?\]/g,'').replace(/\d{9,}/g,'').replace(/\s+/g,' ').trim().toUpperCase()
}

function parseBRL(v: any): number {
  if (!v) return 0
  const s = String(v).replace(/\./g,'').replace(',','.').replace(/[^\d.-]/g,'')
  return parseFloat(s) || 0
}

function lojaKey(loja: string) {
  const u = loja.toUpperCase()
  if (u.includes('VALERIA')) return 'VALERIA'
  if (u.includes('PEDRO')) return 'PEDRO'
  if (u.includes('ERALDO')) return 'ERALDO'
  return loja
}

type FileEntry = {nome:string; status:'aguardando'|'lendo'|'ok'|'erro'; rows?:number; data?:any[][]; erro?:string}

const CONFIGS = [
  {id:'nova_dig',  label:'Nova — Digitação',        desc:'até_dia_XX_digitação_nova.xlsx',        obrig:true},
  {id:'nova_prod', label:'Nova — Produção',          desc:'até_dia_XX_produção_nova.xlsx',         obrig:true},
  {id:'glm',       label:'GLM — Análise (dig+prod)', desc:'Arquivo Export da GLM',                 obrig:false},
  {id:'lev_dig',   label:'Lev — Digitação',          desc:'digitação_lev.xlsx',                    obrig:false},
  {id:'lev_prod',  label:'Lev — Produção',           desc:'produção_lev.xlsx',                     obrig:false},
  {id:'base2025',  label:'Base 2025 (histórico)',    desc:'PRODUCAO_POR_EMPRESA_xxx_2025.xlsx',    obrig:false},
]

export default function UploadPage() {
  const [arquivos, setArquivos] = useState<Record<string,FileEntry>>({})
  const [du, setDu] = useState(20)
  const [processando, setProcessando] = useState(false)
  const [resultado, setResultado] = useState<{ok:boolean;msg:string}|null>(null)
  const [log, setLog] = useState<string[]>([])

  const addLog = (msg: string) => setLog(prev => [...prev, msg])

  const lerXLSX = async (file: File): Promise<any[][]> => {
    const XLSX = (await import('xlsx')) as any
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, {type:'array'})
    const ws = wb.Sheets[wb.SheetNames[0]]
    return XLSX.utils.sheet_to_json(ws, {header:1, defval:''})
  }

  const onDrop = useCallback(async (id: string, files: FileList|null) => {
    if (!files?.length) return
    const file = files[0]
    setArquivos(prev => ({...prev, [id]: {nome:file.name, status:'lendo'}}))
    try {
      const data = await lerXLSX(file)
      setArquivos(prev => ({...prev, [id]: {nome:file.name, status:'ok', rows:data.length, data}}))
    } catch(e) {
      setArquivos(prev => ({...prev, [id]: {nome:file.name, status:'erro', erro:String(e)}}))
    }
  }, [])

  const processar = async () => {
    setProcessando(true); setLog([]); setResultado(null)
    addLog('Iniciando processamento...')
    const fatorNova = DU_TOT / du
    const parceiros: any[] = []

    // ── NOVA ────────────────────────────────────────────────────────────────
    const nd = arquivos['nova_dig']?.data
    const np = arquivos['nova_prod']?.data
    if (nd && np) {
      addLog('Nova: lendo digitação e produção...')
      // col: 0=nr, 1=loja, 3=nome, 8=valor_base — header na linha 0
      const digMap: Record<number,[string,number,string]> = {}
      const prodMap: Record<number,[string,number,string]> = {}
      nd.slice(1).forEach((r:any[]) => {
        const nr = parseInt(r[0]); if(isNaN(nr)) return
        digMap[nr] = [String(r[3]||''), parseFloat(r[8])||0, String(r[1]||'')]
      })
      np.slice(1).forEach((r:any[]) => {
        const nr = parseInt(r[0]); if(isNaN(nr)) return
        prodMap[nr] = [String(r[3]||''), parseFloat(r[8])||0, String(r[1]||'')]
      })
      const allNrs = new Set([...Object.keys(digMap).map(Number), ...Object.keys(prodMap).map(Number)])
      allNrs.forEach(nr => {
        const d = digMap[nr]; const p2 = prodMap[nr]
        const nome = d?.[0]||p2?.[0]||''
        const loja = lojaKey(d?.[2]||p2?.[2]||'')
        const ad = d?.[1]||0; const ap = p2?.[1]||0
        const [sd,pd_] = calcStatus(0,ad,fatorNova)
        const [sp,pp]  = calcStatus(0,ap,fatorNova)
        parceiros.push({
          id:`nova-${nr}`, nr:String(nr), nome, loja, promotora:'Nova',
          du, fator:Math.round(fatorNova*100)/100,
          mar_dig:0, mar_prod:0, prorata_dig:0, prorata_prod:0,
          abr_dig:Math.round(ad*100)/100, abr_prod:Math.round(ap*100)/100,
          gap_dig:Math.round(ad*100)/100, gap_prod:Math.round(ap*100)/100,
          proj_dig:Math.round(pd_*100)/100, proj_prod:Math.round(pp*100)/100,
          var_dig:null, var_prod:null, st_dig:sd, st_prod:sp,
          quadrante:quad(sd,sp),
          media_2025:null,pico_2025:null,pico_mes:null,perfil_2025:null,total_2025:null,meses_ativos:null,
          status:null, observacoes:[]
        })
      })
      addLog(`Nova: ${parceiros.filter(p=>p.promotora==='Nova').length} parceiros`)
    }

    // ── GLM ─────────────────────────────────────────────────────────────────
    const glm = arquivos['glm']?.data
    if (glm) {
      addLog('GLM: lendo análise...')
      // header na linha 2 (index 2), dados a partir da linha 3
      // col: 0=parceiro, 1=prod_abr, 6=dig_abr
      const dataRows = glm.slice(3).filter((r:any[]) => r[0] && !String(r[0]).toLowerCase().includes('total'))
      dataRows.forEach((r:any[]) => {
        const parceiro = String(r[0]||'')
        const codM = parceiro.match(/^(\d+)/)
        if (!codM) return
        const cod = codM[1]
        const nome = parceiro.replace(/^\d+\s*-\s*/,'').trim()
        const ap = parseFloat(r[1])||0
        const ad = parseFloat(r[6])||0
        const fatorGLM = DU_TOT / du
        const [sd,pd_] = calcStatus(0,ad,fatorGLM)
        const [sp,pp]  = calcStatus(0,ap,fatorGLM)
        parceiros.push({
          id:`glm-${cod}`, nr:cod, nome, loja:'GLM', promotora:'GLM',
          du, fator:Math.round(fatorGLM*100)/100,
          mar_dig:0, mar_prod:0, prorata_dig:0, prorata_prod:0,
          abr_dig:Math.round(ad*100)/100, abr_prod:Math.round(ap*100)/100,
          gap_dig:Math.round(ad*100)/100, gap_prod:Math.round(ap*100)/100,
          proj_dig:Math.round(pd_*100)/100, proj_prod:Math.round(pp*100)/100,
          var_dig:null, var_prod:null, st_dig:sd, st_prod:sp,
          quadrante:quad(sd,sp),
          media_2025:null,pico_2025:null,pico_mes:null,perfil_2025:null,total_2025:null,meses_ativos:null,
          status:null, observacoes:[]
        })
      })
      addLog(`GLM: ${parceiros.filter(p=>p.promotora==='GLM').length} parceiros`)
    }

    // ── LEV ──────────────────────────────────────────────────────────────────
    const ld = arquivos['lev_dig']?.data
    const lp = arquivos['lev_prod']?.data
    if (ld || lp) {
      addLog('Lev: lendo digitação e produção...')
      const levDig: Record<string,[string,number]> = {}
      const levProd: Record<string,number> = {}
      const levNomes: Record<string,string> = {}

      if (ld) {
        // header linha 2, dados a partir linha 4 — col: 0=parceiro|cod, 3=liquido
        ld.slice(4).forEach((r:any[]) => {
          if (!r[0] || String(r[0]).startsWith('Total')) return
          const m = String(r[0]).match(/\|\s*(\d+)/)
          if (!m) return
          const cod = m[1]
          const nome = String(r[0]).split('|')[0].trim()
          const val = parseBRL(r[3])
          levDig[cod] = [nome, val]
          levNomes[cod] = nome
        })
      }

      if (lp) {
        // header linha 2, dados a partir linha 3 — col: 0=ag_proposta[cod], 12=val_repasse
        lp.slice(3).forEach((r:any[]) => {
          if (!r[0]) return
          const m = String(r[0]).match(/\[(\d+)\]/)
          if (!m) return
          const cod = m[1]
          const nome = String(r[0]).replace(/\s*\[.*?\]/g,'').replace(/\xa0/g,'').trim()
          const val = parseFloat(r[12])||0
          levProd[cod] = (levProd[cod]||0) + val
          if (!levNomes[cod]) levNomes[cod] = nome
        })
      }

      const allLev = new Set([...Object.keys(levDig), ...Object.keys(levProd)])
      const fatorLev = DU_TOT / du
      allLev.forEach(cod => {
        const nome = levNomes[cod] || `COD ${cod}`
        const ad = levDig[cod]?.[1]||0
        const ap = levProd[cod]||0
        const [sd,pd_] = calcStatus(0,ad,fatorLev)
        const [sp,pp]  = calcStatus(0,ap,fatorLev)
        parceiros.push({
          id:`lev-${cod}`, nr:cod, nome, loja:'LEV', promotora:'Lev',
          du, fator:Math.round(fatorLev*100)/100,
          mar_dig:0, mar_prod:0, prorata_dig:0, prorata_prod:0,
          abr_dig:Math.round(ad*100)/100, abr_prod:Math.round(ap*100)/100,
          gap_dig:Math.round(ad*100)/100, gap_prod:Math.round(ap*100)/100,
          proj_dig:Math.round(pd_*100)/100, proj_prod:Math.round(pp*100)/100,
          var_dig:null, var_prod:null, st_dig:sd, st_prod:sp,
          quadrante:quad(sd,sp),
          media_2025:null,pico_2025:null,pico_mes:null,perfil_2025:null,total_2025:null,meses_ativos:null,
          status:null, observacoes:[]
        })
      })
      addLog(`Lev: ${parceiros.filter(p=>p.promotora==='Lev').length} parceiros`)
    }

    // ── BASE 2025 ────────────────────────────────────────────────────────────
    const base = arquivos['base2025']?.data
    if (base) {
      addLog('Base 2025: cruzando histórico...')
      const baseIdx: Record<string,any[]> = {}
      base.slice(1).filter((r:any[])=>r[0]).forEach((r:any[]) => {
        baseIdx[norm(String(r[1]||''))] = r
      })
      let matched = 0
      parceiros.forEach(p => {
        const n = norm(p.nome)
        let hit = baseIdx[n]
        if (!hit) {
          const palavras = n.split(' ').filter((w:string)=>w.length>4)
          let best: any[]|null = null; let bestScore = 0
          Object.entries(baseIdx).forEach(([k,v]) => {
            const score = palavras.filter((w:string)=>k.includes(w)).length
            if (score >= 2 && score > bestScore) { best=v; bestScore=score }
          })
          if (best) hit = best
        }
        if (hit) {
          p.media_2025  = parseBRL(hit[16])||null
          p.pico_2025   = parseBRL(hit[17])||null
          p.pico_mes    = String(hit[18]||'')||null
          p.perfil_2025 = String(hit[19]||'')||null
          p.total_2025  = parseBRL(hit[14])||null
          p.meses_ativos= parseInt(hit[15])||null
          matched++
        }
      })
      addLog(`Base 2025: ${matched}/${parceiros.length} enriquecidos com histórico`)
    }

    if (parceiros.length === 0) {
      setResultado({ok:false, msg:'Nenhum arquivo válido. Adicione pelo menos Nova Digitação + Nova Produção.'})
      setProcessando(false); return
    }

    // ── Salvar ────────────────────────────────────────────────────────────────
    addLog(`Salvando ${parceiros.length} parceiros...`)
    try {
      const res = await fetch('/api/parceiros', {
        method:'PATCH',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({parceiros_bulk: parceiros})
      })
      const data = await res.json()
      if (data.ok) {
        addLog(`✓ ${data.count} parceiros salvos! Status CRM e observações preservados.`)
        setResultado({ok:true, msg:`${data.count} parceiros atualizados com sucesso!`})
      } else throw new Error(JSON.stringify(data))
    } catch(e) {
      addLog(`✗ Erro: ${e}`)
      setResultado({ok:false, msg:`Erro ao salvar: ${e}`})
    }
    setProcessando(false)
  }

  const temObrig = arquivos['nova_dig']?.status==='ok' && arquivos['nova_prod']?.status==='ok'

  return (
    <div style={{minHeight:'100vh',background:'#f0f2f5',fontFamily:'var(--font-sans,system-ui)'}}>
      <div style={{background:'#07294a',color:'#fff',padding:'0 20px',height:52,display:'flex',alignItems:'center',gap:16,boxShadow:'0 2px 8px rgba(0,0,0,0.2)'}}>
        <a href="/gerencial" style={{display:'flex',alignItems:'center',gap:5,color:'rgba(255,255,255,0.7)',textDecoration:'none',fontSize:12}}>
          <ArrowLeft style={{width:13,height:13}}/> Gerencial
        </a>
        <div style={{width:1,height:22,background:'rgba(255,255,255,0.12)'}}/>
        <div><div style={{fontSize:14,fontWeight:600}}>Melhor Crédito</div><div style={{fontSize:9,color:'#7cc8fb',letterSpacing:'0.08em'}}>ATUALIZAR DADOS</div></div>
      </div>

      <div style={{maxWidth:860,margin:'0 auto',padding:'18px 20px',display:'flex',flexDirection:'column',gap:10}}>

        {/* Info */}
        <div style={{background:'#fff',borderRadius:10,border:'0.5px solid #e8ecf0',padding:'14px 16px'}}>
          <div style={{fontSize:14,fontWeight:600,color:'#0f172a',marginBottom:6}}>Atualizar dados de produção</div>
          <div style={{fontSize:12,color:'#64748b',lineHeight:1.6,marginBottom:12}}>
            Selecione os arquivos de cada promotora. Status CRM e observações da equipe são preservados automaticamente.
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
            <span style={{fontSize:11,color:'#64748b',fontWeight:500}}>Dias úteis do período:</span>
            <div style={{display:'flex',gap:3,flexWrap:'wrap'}}>
              {[7,8,9,10,11,12,13,14,15,16,17,18,19,20,21].map(n=>(
                <button key={n} onClick={()=>setDu(n)}
                  style={{width:30,height:28,borderRadius:5,border:`0.5px solid ${du===n?'#07294a':'#e2e8f0'}`,
                    background:du===n?'#07294a':'#fff',color:du===n?'#fff':'#374151',
                    fontSize:11,cursor:'pointer',fontWeight:du===n?600:400}}>
                  {n}
                </button>
              ))}
            </div>
            <span style={{fontSize:11,color:'#94a3b8'}}>→ fator {(DU_TOT/du).toFixed(2)}× · projeção para 22du</span>
          </div>
        </div>

        {/* Dropzones */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:9}}>
          {CONFIGS.map(cfg => (
            <DropZone key={cfg.id} label={cfg.label} desc={cfg.desc} obrig={cfg.obrig}
              arquivo={arquivos[cfg.id]}
              onChange={files=>onDrop(cfg.id,files)}
              onRemove={()=>setArquivos(prev=>{const n={...prev};delete n[cfg.id];return n})}/>
          ))}
        </div>

        {/* Botão */}
        <div style={{background:'#fff',borderRadius:10,border:'0.5px solid #e8ecf0',padding:'14px 16px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:log.length?12:0}}>
            <div style={{fontSize:12,color:'#64748b'}}>
              {!temObrig
                ? <span style={{color:'#d97706'}}>⚠ Adicione pelo menos Nova Digitação e Nova Produção</span>
                : `${Object.values(arquivos).filter(a=>a.status==='ok').length} arquivo(s) prontos · ${du} dias úteis · fator ${(DU_TOT/du).toFixed(2)}×`}
            </div>
            <button onClick={processar} disabled={!temObrig||processando}
              style={{display:'flex',alignItems:'center',gap:6,padding:'9px 18px',borderRadius:8,border:'none',
                background:temObrig&&!processando?'#07294a':'#e2e8f0',
                color:temObrig&&!processando?'#fff':'#94a3b8',
                cursor:temObrig&&!processando?'pointer':'default',fontSize:13,fontWeight:600}}>
              {processando?<><RefreshCw style={{width:13,height:13}}/> Processando...</>:<><Upload style={{width:13,height:13}}/> Atualizar sistema</>}
            </button>
          </div>
          {log.length>0&&(
            <div style={{background:'#f8fafc',borderRadius:7,border:'0.5px solid #e2e8f0',padding:'10px 12px',fontSize:11,fontFamily:'monospace',lineHeight:1.9,color:'#374151',maxHeight:170,overflowY:'auto'}}>
              {log.map((l,i)=><div key={i}>{l}</div>)}
            </div>
          )}
          {resultado&&(
            <div style={{marginTop:10,padding:'10px 12px',borderRadius:8,display:'flex',alignItems:'center',gap:8,
              background:resultado.ok?'#f0fdf4':'#fef2f2',border:`0.5px solid ${resultado.ok?'#bbf7d0':'#fecaca'}`}}>
              {resultado.ok?<CheckCircle style={{width:15,height:15,color:'#16a34a',flexShrink:0}}/>:<AlertCircle style={{width:15,height:15,color:'#dc2626',flexShrink:0}}/>}
              <div>
                <div style={{fontSize:12,fontWeight:600,color:resultado.ok?'#15803d':'#dc2626'}}>{resultado.msg}</div>
                {resultado.ok&&<a href="/" style={{fontSize:11,color:'#07294a',fontWeight:500}}>Ir para o painel completo →</a>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DropZone({label,desc,obrig,arquivo,onChange,onRemove}: {
  label:string; desc:string; obrig:boolean;
  arquivo?:FileEntry; onChange:(f:FileList|null)=>void; onRemove:()=>void
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  const ok=arquivo?.status==='ok'; const err=arquivo?.status==='erro'; const loading=arquivo?.status==='lendo'
  const border=ok?'#86efac':err?'#fca5a5':drag?'#07294a':'#e2e8f0'
  const bg=ok?'#f0fdf4':err?'#fef2f2':drag?'#eff6ff':'#fff'
  return (
    <div style={{background:bg,border:`0.5px solid ${border}`,borderRadius:9,padding:'11px 13px',cursor:arquivo?'default':'pointer',transition:'all 0.1s'}}
      onClick={()=>!arquivo&&ref.current?.click()}
      onDragOver={e=>{e.preventDefault();setDrag(true)}}
      onDragLeave={()=>setDrag(false)}
      onDrop={e=>{e.preventDefault();setDrag(false);onChange(e.dataTransfer.files)}}>
      <input ref={ref} type="file" accept=".xlsx,.xls" style={{display:'none'}} onChange={e=>onChange(e.target.files)}/>
      {ok?(
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <CheckCircle style={{width:14,height:14,color:'#16a34a',flexShrink:0}}/>
              <div><div style={{fontSize:11,fontWeight:600,color:'#0f172a'}}>{label}</div><div style={{fontSize:10,color:'#16a34a'}}>{arquivo!.nome}</div></div>
            </div>
            <button onClick={e=>{e.stopPropagation();onRemove()}} style={{border:'none',background:'none',cursor:'pointer',color:'#94a3b8',padding:1}}><X style={{width:12,height:12}}/></button>
          </div>
          <div style={{fontSize:10,color:'#64748b',marginTop:3}}>{arquivo!.rows} linhas · clique no X para trocar</div>
        </div>
      ):err?(
        <div>
          <div style={{display:'flex',alignItems:'center',gap:6}}><AlertCircle style={{width:14,height:14,color:'#dc2626',flexShrink:0}}/><div style={{fontSize:11,fontWeight:600,color:'#dc2626'}}>{label}</div></div>
          <div style={{fontSize:10,color:'#dc2626',marginTop:2}}>{arquivo!.erro}</div>
          <button onClick={e=>{e.stopPropagation();onRemove()}} style={{fontSize:10,color:'#64748b',border:'none',background:'none',cursor:'pointer',marginTop:4,padding:0}}>Tentar novamente</button>
        </div>
      ):loading?(
        <div style={{display:'flex',alignItems:'center',gap:6}}><RefreshCw style={{width:13,height:13,color:'#07294a'}}/><span style={{fontSize:11,color:'#07294a'}}>Lendo arquivo...</span></div>
      ):(
        <div>
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
            <FileSpreadsheet style={{width:14,height:14,color:'#94a3b8',flexShrink:0}}/>
            <div><div style={{fontSize:11,fontWeight:600,color:'#0f172a'}}>{label}{obrig&&<span style={{color:'#dc2626',marginLeft:2}}>*</span>}</div><div style={{fontSize:9,color:'#94a3b8'}}>{desc}</div></div>
          </div>
          <div style={{fontSize:10,color:'#94a3b8',textAlign:'center',marginTop:5,paddingTop:5,borderTop:'0.5px dashed #e2e8f0'}}>Arraste ou clique para selecionar</div>
        </div>
      )}
    </div>
  )
}
