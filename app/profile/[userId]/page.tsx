import { getPublicUserProfile } from '@/lib/server/users'
import PublicProfileContent from '@/components/profile/PublicProfileContent'

interface PageProps {
  params: Promise<{
    userId: string
  }>
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { userId } = await params // ✅ Await the params promise
  const profileData = await getPublicUserProfile(userId)

  // Handle user not found
  if (!profileData) {
    return (
      <div className="bg-background min-h-screen p-6">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-4 text-4xl font-bold">User Not Found</h1>
          <p className="text-muted-foreground">
            This user account has been deleted or does not exist.
          </p>
        </div>
      </div>
    )
  }

  // Require analysis completion to view profile
  if (!profileData.user.follicleId) {
    return (
      <div className="bg-background min-h-screen p-6">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-4 text-4xl font-bold">Profile Not Available</h1>
          <p className="text-muted-foreground">
            This user hasn't completed their hair analysis yet.
          </p>
        </div>
      </div>
    )
  }

  return (
    <PublicProfileContent
      userData={profileData.user}
      stats={profileData.stats}
    />
  )
}
