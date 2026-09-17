import type { Metadata } from 'next'
import AppShell from '../_app-shell'

export const metadata: Metadata = {
  title: 'AI Vén Màn | Chiếu Chèo Sương Oan',
}

export default function AiVeilRoute() {
  return <AppShell initialPage="ven" />
}
