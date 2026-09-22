import type { Metadata } from 'next'
import AppShell from '../_app-shell'

export const metadata: Metadata = {
  title: 'Thẻ Nhịp–Phách | Chiếu Chèo Sương Oan',
}

export default function RhythmRoute() {
  return <AppShell initialPage="rhythm" />
}
