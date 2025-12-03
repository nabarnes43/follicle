import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { adminAuth } from '@/lib/firebase/admin'

export async function POST(request: NextRequest) {
  try {
    // Verify the user's token
    const authHeader = request.headers.get('authorization')

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    const userId = decodedToken.uid

    // Invalidate the user's cached scores with 'max' profile for SWR behavior
    revalidateTag(`user-scores-${userId}`, 'max')

    console.log(`🔄 Invalidated cache for user ${userId}`)

    return NextResponse.json({ success: true, userId })
  } catch (error) {
    console.error('❌ Revalidation error:', error)
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}
