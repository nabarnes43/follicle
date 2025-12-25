// app/actions/cache.ts
'use server'
import { revalidatePath } from 'next/cache'

export async function bustUserCache(userId: string) {
  revalidatePath('/products', 'page')
  revalidatePath('/routines/public', 'page')
}
