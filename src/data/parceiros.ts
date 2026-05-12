export type { Status, Empresa, Sala, Perfil } from './types'
export type { Parceiro } from './parceiros_data'
export { parceirosData as parceiros } from './parceiros_data'

import type { Status, Perfil } from './types'

export const statusConfig: Record<Status, { bg: string; text: string; dot: string }> = {
  'Ativo':             { bg: '#dcfce7', text: '#14532d', dot: '#22c55e' },
  'Parou':             { bg: '#fee2e2', text: '#7f1d1d', dot: '#ef4444' },
  'Migrou':            { bg: '#dbeafe', text: '#1e3a5f', dot: '#3b82f6' },
  'Venda Fraca':       { bg: '#fef3c7', text: '#78350f', dot: '#f59e0b' },
  'Em Negociação':     { bg: '#ccfbf1', text: '#134e4a', dot: '#14b8a6' },
  'Lista Transmissão': { bg: '#ede9fe', text: '#4c1d95', dot: '#8b5cf6' },
}

export const perfilConfig: Record<Perfil, { bg: string; text: string }> = {
  'SÓLIDO':        { bg: '#E2EFDA', text: '#375623' },
  'CONFIÁVEL':     { bg: '#D6E4F0', text: '#07294a' },
  'OPORTUNISTA':   { bg: '#FFF2CC', text: '#7F6000' },
  'NÃO CONFIÁVEL': { bg: '#FCE4D6', text: '#843C0C' },
  'NOVO':          { bg: '#F2F2F2', text: '#595959' },
}

export const empresaConfig: Record<string, { cor: string; label: string }> = {
  NOVA:   { cor: '#1F3864', label: 'Nova Promotora' },
  GLM:    { cor: '#0B5345', label: 'GLM' },
  LEV:    { cor: '#512DA8', label: 'Lev' },
  LHAMAS: { cor: '#6D4C41', label: 'Lhamas' },
}

export const salaConfig: Record<string, { cor: string; label: string }> = {
  PEDRO:   { cor: '#1A5276', label: 'Pedro Henrique' },
  VALERIA: { cor: '#1F3864', label: 'Valéria Gasparidis' },
  ERALDO:  { cor: '#145A32', label: 'Eraldo Bomfim' },
  GLM:     { cor: '#0B5345', label: 'GLM' },
  LEV:     { cor: '#512DA8', label: 'Lev' },
}

export function formatBRL(v: number): string {
  if (!v || v === 0) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

export function perfilNorm(p: string): Perfil {
  const s = (p || '').toUpperCase().replace('PRODUTOR ', '').trim()
  if (s === 'SÓLIDO') return 'SÓLIDO'
  if (s === 'CONFIÁVEL') return 'CONFIÁVEL'
  if (s === 'OPORTUNISTA') return 'OPORTUNISTA'
  if (s === 'NÃO CONFIÁVEL') return 'NÃO CONFIÁVEL'
  return 'NOVO'
}
