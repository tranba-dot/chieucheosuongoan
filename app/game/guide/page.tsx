import type { Metadata } from 'next'
import AppShell from '../../_app-shell'

export const metadata: Metadata = {
  title: 'Hướng dẫn chơi | Chiếu Chèo Sương Oan',
}

export default function GuideRoute() {
  return <AppShell initialPage="guide" />
}
