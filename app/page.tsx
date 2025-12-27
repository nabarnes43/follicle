// app/page.tsx
import { getServerUser } from '@/lib/server/auth'
import { redirect } from 'next/navigation'
import { LandingPageClient } from '@/components/landing/LandingPageClient'

export default async function HomePage() {
  const user = await getServerUser()

  // Skip landing for users with analysis
  if (user?.follicleId) {
    redirect('/products')
  }

  // Show landing page
  return <LandingPageClient />
}
