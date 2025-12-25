import { getServerUser } from '@/lib/server/auth'
import { AnalysisResultsClient } from '@/components/analysis/AnalysisResultsClient'

interface ResultsPageProps {
  searchParams: Promise<{ follicleId?: string }>
}

export default async function AnalysisResultsPage({
  searchParams,
}: ResultsPageProps) {
  const { follicleId } = await searchParams
  const user = await getServerUser()

  if (!user || !follicleId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Invalid request</p>
      </div>
    )
  }

  return (
    <AnalysisResultsClient follicleId={follicleId} initialUserData={user} />
  )
}
