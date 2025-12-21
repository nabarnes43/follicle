import { getServerUser } from '@/lib/server/auth'
import { AnalysisRequired } from '@/components/auth/AnalysisRequired'
import ProfileContent from '@/components/profile/ProfileContent'

export default async function ProfilePage() {
  const userData = await getServerUser()

  if (!userData?.follicleId) {
    return (
      <AnalysisRequired message="Complete your hair analysis to view your profile" />
    )
  }

  return <ProfileContent userData={userData} />
}
