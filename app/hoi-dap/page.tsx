import type { Metadata } from 'next'
import AppShell from '../_app-shell'

export const metadata: Metadata = {
  title: 'AI Hỏi Đáp | Chiếu Chèo Sương Oan',
}

export default function QaRoute() {
  return <AppShell initialPage="qa" />
}
