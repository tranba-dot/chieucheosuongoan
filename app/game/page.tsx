import type { Metadata } from 'next'
import AppShell from '../_app-shell'

export const metadata: Metadata = {
  title: 'Chiếu Chèo Sương Oan | Game hub',
}

export default function GameHubRoute() {
  return <AppShell initialPage="game" />
}
