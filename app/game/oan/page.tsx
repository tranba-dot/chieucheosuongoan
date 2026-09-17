import type { Metadata } from 'next'
import AppShell from '../../_app-shell'

export const metadata: Metadata = {
  title: 'Kiểm chứng Oan | Chiếu Chèo Sương Oan',
}

export default function OanQrRoute() {
  return <AppShell initialPage="oan" />
}
