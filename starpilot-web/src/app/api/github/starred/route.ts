import { NextRequest, NextResponse } from 'next/server'
import { GitHubService } from '@/lib/github'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    const githubService = new GitHubService(token)
    
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('per_page') || '100')
    const fetchAll = searchParams.get('all') === 'true'

    let repos
    if (fetchAll) {
      repos = await githubService.getAllStarredRepos()
    } else {
      repos = await githubService.getStarredRepos(page, perPage)
    }

    return NextResponse.json(repos)
  } catch (error) {
    console.error('GitHub API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch starred repositories' },
      { status: 500 }
    )
  }
}