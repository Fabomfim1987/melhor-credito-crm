export type StatusCRM =
  | 'ativo'
  | 'parou'
  | 'migrou'
  | 'venda_fraca'
  | 'em_negociacao'
  | 'lista_transmissao'
  | null

export interface Observacao {
  id: string
  texto: string
  autor: string
  data: string
}

export interface MesDado {
  prod: number
  dig: number
}

export interface UltimoDia {
  prod: number
  dig: number
  data: string
}

export interface Parceiro {
  id: string
  nr: string
  nome: string
  loja: string
  promotora: string
  du: number
  fator: number

  // Legado (mantido para compatibilidade)
  mar_dig: number
  mar_prod: number
  prorata_dig: number
  prorata_prod: number

  // Mês atual (acumulado)
  abr_dig: number
  abr_prod: number
  gap_dig: number
  gap_prod: number
  proj_dig: number
  proj_prod: number
  var_dig: number | null
  var_prod: number | null

  st_dig: string
  st_prod: string
  quadrante: string

  // Histórico por mês — chave: 'MM/YYYY' ex: '03/2026'
  meses?: Record<string, MesDado>

  // Último dia processado pelo bot
  ultimo_dia?: UltimoDia

  // Referência do mês atual enviado pelo bot
  mes_ref?: string

  // Campos enviados pelo bot para último dia
  ultimo_dia_prod?: number
  ultimo_dia_dig?: number
  ultimo_dia_data?: string

  // Histórico 2025
  media_2025: number | null
  pico_2025: number | null
  pico_mes: string | null
  perfil_2025: string | null
  total_2025: number | null
  meses_ativos: number | null

  // CRM
  status: StatusCRM
  observacoes: Observacao[]
  ultima_atualizacao?: string

  // Calculado no GET (não persistido)
  meses_display?: Array<{ mes: string; prod: number; dig: number }>
}

// Configs de UI
export const STATUS_CFG: Record<NonNullable<StatusCRM>, {
  label: string; bg: string; color: string; border: string; dot: string; desc: string
}> = {
  ativo:            { label: 'Ativo',            bg: '#dcfce7', color: '#14532d', border: '#86efac', dot: '#22c55e', desc: 'Operando normalmente' },
  parou:            { label: 'Parou',            bg: '#fee2e2', color: '#7f1d1d', border: '#fca5a5', dot: '#ef4444', desc: 'Produzindo em outra promotora fora do grupo' },
  migrou:           { label: 'Migrou',           bg: '#dbeafe', color: '#1e3a5f', border: '#93c5fd', dot: '#3b82f6', desc: 'Mudou de promotora dentro do grupo MC' },
  venda_fraca:      { label: 'Venda Fraca',      bg: '#fef3c7', color: '#78350f', border: '#fcd34d', dot: '#f59e0b', desc: 'Operando abaixo do esperado' },
  em_negociacao:    { label: 'Em Negociação',    bg: '#ccfbf1', color: '#134e4a', border: '#5eead4', dot: '#14b8a6', desc: 'Negociando condições para retomada' },
  lista_transmissao:{ label: 'Lista Transmissão',bg: '#ede9fe', color: '#4c1d95', border: '#c4b5fd', dot: '#8b5cf6', desc: 'Negociação frustrada — contato passivo' },
}

export const Q_CFG: Record<string, { bg: string; color: string; label: string }> = {
  Q1: { bg: '#fecaca', color: '#7f1d1d', label: 'Alerta Máximo' },
  Q2: { bg: '#fed7aa', color: '#78350f', label: 'Alerta' },
  Q3: { bg: '#fef08a', color: '#713f12', label: 'Dig OK / Prod Baixa' },
  Q4: { bg: '#bfdbfe', color: '#1e3a5f', label: 'Conv. Residual' },
  Q5: { bg: '#bbf7d0', color: '#14532d', label: 'Saudável' },
  Q6: { bg: '#f3f4f6', color: '#374151', label: 'Sem Movimento' },
}

export const PERFIL_CFG: Record<string, { bg: string; color: string }> = {
  'PRODUTOR SÓLIDO':        { bg: '#E2EFDA', color: '#375623' },
  'PRODUTOR CONFIÁVEL':     { bg: '#D6E4F0', color: '#07294a' },
  'PRODUTOR OPORTUNISTA':   { bg: '#FFF2CC', color: '#7F6000' },
  'PRODUTOR NÃO CONFIÁVEL': { bg: '#FCE4D6', color: '#843C0C' },
}
