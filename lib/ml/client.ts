// Health check
export async function checkMLHealth() {
  try {
    const response = await fetch(`${process.env.ML_API_URL}/api/health`)
    return await response.json()
  } catch (error) {
    console.error('ML Health Check Failed:', error)
    return { status: 'unhealthy', error: String(error) }
  }
}
