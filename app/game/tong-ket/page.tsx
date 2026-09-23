import type { Metadata } from 'next'
import AppShell from '../../_app-shell'

export const metadata: Metadata = {
  title: 'Chiếu Chèo Sương Oan | Tổng kết chương',
}

export default function TongKetRoute() {
  return <AppShell initialPage="tongket" />
}
