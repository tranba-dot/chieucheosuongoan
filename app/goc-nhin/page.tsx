import type { Metadata } from 'next'
import AppShell from '../_app-shell'

export const metadata: Metadata = {
  title: 'Góc nhìn | Chiếu Chèo Sương Oan',
}

export default function PerspectiveRoute() {
  return <AppShell initialPage="perspective" />
}
