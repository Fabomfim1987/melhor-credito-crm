import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Melhor Crédito CRM', description: 'Painel de Produção' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR"><body style={{margin:0,fontFamily:'system-ui',background:'#f0f2f5'}}>{children}</body></html>
}
