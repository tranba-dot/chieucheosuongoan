import type { Metadata } from 'next'
import AppShell from '../_app-shell'

export const metadata: Metadata = {
  title: 'Hành trình | Chiếu Chèo Sương Oan',
}

export default function JourneyRoute() {
  return <AppShell initialPage="journey" />
}
