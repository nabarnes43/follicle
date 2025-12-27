import { getServerUser } from '@/lib/server/auth'
import { AnalysisRequired } from '@/components/auth/AnalysisRequired'
import PrivateProfileContent from '@/components/profile/PrivateProfileContent'

export default async function ProfilePage() {
  const userData = await getServerUser()

  if (!userData?.follicleId) {
    return (
      <AnalysisRequired
        message="Complete your hair analysis to view your profile"
        showSignInPrompt={userData?.isAnonymous}
      />
    )
  }

  return <PrivateProfileContent userData={userData} />
}
