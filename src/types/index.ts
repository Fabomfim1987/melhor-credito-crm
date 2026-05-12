export type StatusCRM = 'parou'|'migrou'|'venda_fraca'|'em_negociacao'|'lista_transmissao'|'ativo'|null

export interface Observacao { id:string; texto:string; autor:string; data:string }

export interface Parceiro {
  id:string; nr:string; nome:string; loja:string; promotora:string
  du:number; fator:number
  // Março 2026
  mar_dig:number; mar_prod:number
  prorata_dig:number; prorata_prod:number
  abr_dig:number; abr_prod:number
  gap_dig:number; gap_prod:number
  proj_dig:number; proj_prod:number
  var_dig:number|null; var_prod:number|null
  st_dig:string; st_prod:string; quadrante:string
  // Histórico 2025
  media_2025:number|null; pico_2025:number|null
  pico_mes:string|null; perfil_2025:string|null
  total_2025:number|null; meses_ativos:number|null
  // CRM
  status:StatusCRM; observacoes:Observacao[]; ultima_atualizacao?:string
}

export const STATUS_CFG: Record<NonNullable<StatusCRM>,{label:string;color:string;bg:string;border:string;dot:string;desc:string}> = {
  parou:            {label:'Parou',            color:'#7f1d1d',bg:'#fee2e2',border:'#fca5a5',dot:'#ef4444',desc:'Produzindo em outra promotora fora do grupo'},
  migrou:           {label:'Migrou',           color:'#1e3a5f',bg:'#dbeafe',border:'#93c5fd',dot:'#3b82f6',desc:'Mudou de promotora dentro do grupo MC'},
  venda_fraca:      {label:'Venda Fraca',      color:'#78350f',bg:'#fef3c7',border:'#fcd34d',dot:'#f59e0b',desc:'Operando abaixo do esperado'},
  em_negociacao:    {label:'Em Negociação',    color:'#134e4a',bg:'#ccfbf1',border:'#5eead4',dot:'#14b8a6',desc:'Negociando condições para retomada'},
  lista_transmissao:{label:'Lista Transmissão',color:'#4c1d95',bg:'#ede9fe',border:'#c4b5fd',dot:'#8b5cf6',desc:'Negociação frustrada — contato passivo'},
  ativo:            {label:'Ativo',            color:'#14532d',bg:'#dcfce7',border:'#86efac',dot:'#22c55e',desc:'Operando normalmente'},
}

export const Q_CFG: Record<string,{label:string;color:string;bg:string}> = {
  Q1:{label:'Alerta Máximo',   color:'#7f1d1d',bg:'#fee2e2'},
  Q2:{label:'Alerta',          color:'#7c2d12',bg:'#ffedd5'},
  Q3:{label:'Dig ok/Prod baixa',color:'#713f12',bg:'#fef9c3'},
  Q4:{label:'Conv. Residual',  color:'#1e3a8a',bg:'#dbeafe'},
  Q5:{label:'Saudável',        color:'#14532d',bg:'#dcfce7'},
  Q6:{label:'Sem movimento',   color:'#374151',bg:'#f3f4f6'},
}

export const PERFIL_CFG: Record<string,{color:string;bg:string}> = {
  'PRODUTOR SÓLIDO':         {color:'#14532d',bg:'#dcfce7'},
  'PRODUTOR CONFIÁVEL':      {color:'#1e3a8a',bg:'#dbeafe'},
  'PRODUTOR OPORTUNISTA':    {color:'#78350f',bg:'#fef3c7'},
  'PRODUTOR NÃO CONFIÁVEL':  {color:'#7f1d1d',bg:'#fee2e2'},
}
