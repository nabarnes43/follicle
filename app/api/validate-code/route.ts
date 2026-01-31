import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuthToken } from '@/lib/firebase/auth'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(request: NextRequest) {
  try {
    // Must be authenticated
    const userId = await verifyAuthToken(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get code from request body
    const { code } = await request.json()
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    // Normalize code (uppercase, trim)
    const normalizedCode = code.trim().toUpperCase()

    // Check if user already has access
    const userDoc = await adminDb.collection('users').doc(userId).get()
    if (userDoc.exists && userDoc.data()?.accessCode) {
      return NextResponse.json(
        { error: 'Access already granted' },
        { status: 400 }
      )
    }

    // Check if code exists and is unused
    const codeRef = adminDb.collection('access_codes').doc(normalizedCode)
    const codeDoc = await codeRef.get()

    if (!codeDoc.exists) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
    }

    if (codeDoc.data()?.used) {
      return NextResponse.json({ error: 'Code already used' }, { status: 400 })
    }

    // Mark code as used and update user doc in a batch
    const batch = adminDb.batch()

    batch.update(codeRef, {
      used: true,
      usedBy: userId,
      usedAt: FieldValue.serverTimestamp(),
    })

    batch.set(
      adminDb.collection('users').doc(userId),
      {
        accessCode: normalizedCode,
        accessGrantedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    await batch.commit()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error validating code:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
