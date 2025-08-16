import { NextRequest, NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { query, repos, apiKey } = await request.json()
    
    if (!query || !repos || !apiKey) {
      return NextResponse.json(
        { error: 'Query, repos, and API key are required' },
        { status: 400 }
      )
    }

    const openaiService = new OpenAIService(apiKey)
    const results = await openaiService.intelligentQuery(query, repos)
    
    return NextResponse.json(results)
  } catch (error) {
    console.error('Intelligent search error:', error)
    return NextResponse.json(
      { error: 'Failed to perform intelligent search' },
      { status: 500 }
    )
  }
}