// Debug: Test API endpoint
export async function testLoginAPI() {
  try {
    console.log('🧪 Testing login API...')
    
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email: 'admin@demo.com', 
        password: 'admin123' 
      }),
    })

    console.log('📡 Response status:', response.status)
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))
    
    const data = await response.json()
    console.log('📦 Response data:', data)
    
    return data
  } catch (error) {
    console.error('❌ API Error:', error)
    return { success: false, error: (error as Error).message }
  }
}

// Debug: Test cookie setting
export function testCookieSetting() {
  console.log('🍪 Testing cookie setting...')
  
  // Set test cookie
  document.cookie = 'admin-token=test-token-123; path=/; max-age=86400'
  
  // Read cookies
  const cookies = document.cookie
  console.log('🍪 Current cookies:', cookies)
  
  // Check specific cookie
  const tokenCookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('admin-token='))
    ?.split('=')[1]
  
  console.log('🔑 Token cookie value:', tokenCookie)
  
  return tokenCookie
}


