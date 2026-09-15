import { redirect } from 'next/navigation'

export default async function OanQrRoute({ searchParams }: { searchParams: Promise<{ oan?: string }> }) {
  const params = await searchParams
  redirect(`/?oan=${encodeURIComponent(params.oan ?? 'oan-01')}`)
}
