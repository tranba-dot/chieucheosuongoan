import type { Metadata } from 'next'
import AppShell from '../_app-shell'

export const metadata: Metadata = {
  title: 'Thẻ Tích Truyện | Chiếu Chèo Sương Oan',
}

export default function StoryRoute() {
  return <AppShell initialPage="story" />
}
