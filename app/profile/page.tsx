import { getServerUser } from '@/lib/server/auth'
import { AnalysisRequired } from '@/components/auth/AnalysisRequired'
import PrivateProfileContent from '@/components/profile/PrivateProfileContent'
import { AccessCodeForm } from '@/components/auth/AccessCodeForm'

export default async function ProfilePage() {
  const user = await getServerUser()

  // Needs access code (everyone, including anonymous)
  if (!user?.accessCode) {
    return <AccessCodeForm />
  }

  // Needs analysis
  if (!user?.follicleId) {
    return (
      <AnalysisRequired
        showSignInPrompt={user?.isAnonymous}
      />
    )
  }

  return <PrivateProfileContent user={user} />
}
