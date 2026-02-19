import { AccessCodeForm } from '@/components/auth/AccessCodeForm'
import { AnalysisRequired } from '@/components/auth/AnalysisRequired'
import { AddProductClient } from '@/components/products/AddProductClient'
import { getServerUser } from '@/lib/server/auth'

export default async function AddProductPage() {
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
    
  return <AddProductClient />
}
