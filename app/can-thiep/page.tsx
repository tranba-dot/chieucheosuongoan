import type { Metadata } from 'next'
import AppShell from '../_app-shell'

export const metadata: Metadata = {
  title: 'Thẻ Can Thiệp | Chiếu Chèo Sương Oan',
}

export default function InterventionRoute() {
  return <AppShell initialPage="intervention" />
}
