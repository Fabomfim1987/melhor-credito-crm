export type Status = 'Ativo' | 'Parou' | 'Migrou' | 'Venda Fraca' | 'Em Negociação' | 'Lista Transmissão'

export type Quadrante = 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Q5' | 'Q6'

export interface Parceiro {
  id: number
  nome: string
  sala: 'PEDRO' | 'VALERIA' | 'ERALDO'
  status: Status
  quadrante: Quadrante
  producao: number
  digitacao: number
  spread: number
}

export const parceiros: Parceiro[] = [
  // PEDRO
  { id: 1, nome: 'João da Silva', sala: 'PEDRO', status: 'Ativo', quadrante: 'Q5', producao: 320000, digitacao: 45, spread: 2.1 },
  { id: 2, nome: 'Maria Oliveira', sala: 'PEDRO', status: 'Venda Fraca', quadrante: 'Q3', producao: 85000, digitacao: 12, spread: 1.8 },
  { id: 3, nome: 'Carlos Mendes', sala: 'PEDRO', status: 'Parou', quadrante: 'Q1', producao: 0, digitacao: 0, spread: 0 },
  { id: 4, nome: 'Ana Costa', sala: 'PEDRO', status: 'Ativo', quadrante: 'Q5', producao: 210000, digitacao: 33, spread: 2.4 },
  { id: 5, nome: 'Roberto Lima', sala: 'PEDRO', status: 'Em Negociação', quadrante: 'Q4', producao: 40000, digitacao: 0, spread: 1.5 },

  // VALERIA
  { id: 6, nome: 'Ygor Brito', sala: 'VALERIA', status: 'Ativo', quadrante: 'Q5', producao: 818000, digitacao: 98, spread: 0.21 },
  { id: 7, nome: 'Fernanda Ramos', sala: 'VALERIA', status: 'Ativo', quadrante: 'Q5', producao: 156000, digitacao: 28, spread: 1.9 },
  { id: 8, nome: 'Paulo Souza', sala: 'VALERIA', status: 'Venda Fraca', quadrante: 'Q2', producao: 62000, digitacao: 5, spread: 1.2 },
  { id: 9, nome: 'Luciana Ferreira', sala: 'VALERIA', status: 'Migrou', quadrante: 'Q1', producao: 0, digitacao: 0, spread: 0 },
  { id: 10, nome: 'Diego Santos', sala: 'VALERIA', status: 'Ativo', quadrante: 'Q3', producao: 95000, digitacao: 18, spread: 1.7 },

  // ERALDO
  { id: 11, nome: 'Elciane Pereira', sala: 'ERALDO', status: 'Ativo', quadrante: 'Q5', producao: 280000, digitacao: 41, spread: 2.0 },
  { id: 12, nome: 'Marcos Paulo', sala: 'ERALDO', status: 'Venda Fraca', quadrante: 'Q3', producao: 71000, digitacao: 9, spread: 1.4 },
  { id: 13, nome: 'Tatiane Alves', sala: 'ERALDO', status: 'Ativo', quadrante: 'Q5', producao: 190000, digitacao: 27, spread: 2.2 },
  { id: 14, nome: 'Henrique Nogueira', sala: 'ERALDO', status: 'Em Negociação', quadrante: 'Q4', producao: 55000, digitacao: 0, spread: 1.1 },
  { id: 15, nome: 'Simone Castro', sala: 'ERALDO', status: 'Parou', quadrante: 'Q1', producao: 0, digitacao: 0, spread: 0 },
]

export const gestores = [
  { key: 'PEDRO', nome: 'Pedro Henrique', cor: '#1A5276' },
  { key: 'VALERIA', nome: 'Valéria Gasparidis', cor: '#1F3864' },
  { key: 'ERALDO', nome: 'Eraldo Bomfim', cor: '#145A32' },
] as const

export const statusConfig: Record<Status, { bg: string; text: string; dot: string }> = {
  'Ativo':            { bg: '#dcfce7', text: '#14532d', dot: '#22c55e' },
  'Parou':            { bg: '#fee2e2', text: '#7f1d1d', dot: '#ef4444' },
  'Migrou':           { bg: '#dbeafe', text: '#1e3a5f', dot: '#3b82f6' },
  'Venda Fraca':      { bg: '#fef3c7', text: '#78350f', dot: '#f59e0b' },
  'Em Negociação':    { bg: '#ccfbf1', text: '#134e4a', dot: '#14b8a6' },
  'Lista Transmissão':{ bg: '#ede9fe', text: '#4c1d95', dot: '#8b5cf6' },
}

export const quadranteConfig: Record<Quadrante, { bg: string; text: string; label: string }> = {
  Q1: { bg: '#FCE4D6', text: '#843C0C', label: 'Alerta Máximo' },
  Q2: { bg: '#FEF3E2', text: '#E07B00', label: 'Alerta' },
  Q3: { bg: '#FFF2CC', text: '#7F6000', label: 'Dig OK / Prod Baixa' },
  Q4: { bg: '#E6F1FB', text: '#0C447C', label: 'Conv. Residual' },
  Q5: { bg: '#E2EFDA', text: '#375623', label: 'Saudável' },
  Q6: { bg: '#F2F2F2', text: '#595959', label: 'Sem Movimento' },
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}
