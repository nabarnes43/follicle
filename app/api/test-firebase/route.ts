import { adminDb } from '@/lib/firebase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Try to read from Firestore
    const testDoc = await adminDb.collection('_test').doc('connection').get()
    
    return NextResponse.json({
      success: true,
      message: 'Firebase connected successfully!',
      hasData: testDoc.exists,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}