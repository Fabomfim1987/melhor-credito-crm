export type StatusCRM = 'ativo'|'parou'|'migrou'|'venda_fraca'|'em_negociacao'|'lista_transmissao'|null

export interface MesDisplay { mes: string; prod: number; dig: number }
export interface UltimoDia { data: string; prod: number; dig: number }
export interface Observacao { id: string; autor: string; data: string; texto: string }

export interface Parceiro {
  id: string; nr: string; nome: string; loja: string; promotora: string
  du: number; fator: number; mes_ref: string
  abr_dig: number; abr_prod: number
  mar_dig: number; mar_prod: number
  prorata_dig: number; prorata_prod: number
  gap_dig: number; gap_prod: number
  proj_dig: number; proj_prod: number
  var_dig: number|null; var_prod: number|null
  st_dig: string; st_prod: string; quadrante: string
  media_2025: number|null; pico_2025: number|null; pico_mes: string|null
  perfil_2025: string|null; total_2025: number|null; meses_ativos: number|null
  status: StatusCRM; observacoes: Observacao[]
  ultima_atualizacao: string|null
  historico_mensal: Record<string,{prod:number;dig:number}>
  meses_display: MesDisplay[]
  ultimo_dia: UltimoDia|null
}

export const STATUS_CFG: Record<NonNullable<StatusCRM>,{label:string;color:string;bg:string;border:string;dot:string;desc:string}> = {
  ativo:             {label:'Ativo',            color:'#14532d',bg:'#dcfce7',border:'#86efac',dot:'#16a34a',desc:'Produzindo normalmente'},
  parou:             {label:'Parou',            color:'#7f1d1d',bg:'#fee2e2',border:'#fca5a5',dot:'#dc2626',desc:'Parou de produzir'},
  migrou:            {label:'Migrou',           color:'#1e3a5f',bg:'#dbeafe',border:'#93c5fd',dot:'#2563eb',desc:'Migrou para outra promotora'},
  venda_fraca:       {label:'Venda Fraca',      color:'#78350f',bg:'#fef3c7',border:'#fcd34d',dot:'#f59e0b',desc:'Produção abaixo do esperado'},
  em_negociacao:     {label:'Em Negociação',    color:'#134e4a',bg:'#ccfbf1',border:'#5eead4',dot:'#0d9488',desc:'Em processo de negociação'},
  lista_transmissao: {label:'Lista Transmissão',color:'#4c1d95',bg:'#ede9fe',border:'#c4b5fd',dot:'#7c3aed',desc:'Na lista de transmissão'},
}

export const Q_CFG: Record<string,{color:string;bg:string;label?:string}> = {
  Q1:{color:'#7f1d1d',bg:'#fee2e2'},Q2:{color:'#78350f',bg:'#fef3c7'},
  Q3:{color:'#134e4a',bg:'#ccfbf1'},Q4:{color:'#1e3a5f',bg:'#dbeafe'},
  Q5:{color:'#14532d',bg:'#dcfce7'},Q6:{color:'#374151',bg:'#f3f4f6'},
}

export const PERFIL_CFG: Record<string,{color:string;bg:string}> = {
  'PRODUTOR SÓLIDO':         {color:'#14532d',bg:'#dcfce7'},
  'PRODUTOR CONFIÁVEL':      {color:'#1e3a5f',bg:'#dbeafe'},
  'PRODUTOR OPORTUNISTA':    {color:'#78350f',bg:'#fef3c7'},
  'PRODUTOR NÃO CONFIÁVEL':  {color:'#7f1d1d',bg:'#fee2e2'},
}
