import { NextRequest, NextResponse } from 'next/server'
import { testGitHubToken } from '@/lib/github'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    const isValid = await testGitHubToken(token)
    
    return NextResponse.json({ valid: isValid })
  } catch (error) {
    console.error('GitHub token test error:', error)
    return NextResponse.json(
      { error: 'Failed to test GitHub token' },
      { status: 500 }
    )
  }
}