import type { Metadata } from 'next'
import AppShell from '../_app-shell'

export const metadata: Metadata = {
  title: 'Về dự án | Chiếu Chèo Sương Oan',
}

export default function IntroductionRoute() {
  return <AppShell initialPage="about" />
}
