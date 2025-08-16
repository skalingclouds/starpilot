import { NextRequest, NextResponse } from 'next/server'
import { testOpenAIKey } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json()
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      )
    }

    const isValid = await testOpenAIKey(apiKey)
    
    return NextResponse.json({ valid: isValid })
  } catch (error) {
    console.error('OpenAI key test error:', error)
    return NextResponse.json(
      { error: 'Failed to test OpenAI API key' },
      { status: 500 }
    )
  }
}