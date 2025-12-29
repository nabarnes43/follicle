import { NextResponse } from 'next/server'
import { adminDb, adminAuth } from '@/lib/firebase/admin'

export async function GET() {
  try {
    // Test 1: Can we access adminAuth?
    console.log('Test 1: adminAuth exists:', !!adminAuth)

    // Test 2: Can we fetch from Firestore?
    const testDoc = await adminDb.collection('products').limit(1).get()
    console.log('Test 2: Firestore query succeeded, docs:', testDoc.size)

    return NextResponse.json({
      success: true,
      authExists: !!adminAuth,
      firestoreWorks: true,
      docCount: testDoc.size,
    })
  } catch (error: any) {
    console.error('Firebase Admin test failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        stack: error.stack,
      },
      { status: 500 }
    )
  }
}
