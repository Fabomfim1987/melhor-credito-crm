import type { Metadata } from 'next'
import './globals.css'
export const metadata: Metadata = { title: 'Melhor Crédito — Painel de Produção', description: 'CRM de parceiros' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR"><body>{children}</body></html>
}
