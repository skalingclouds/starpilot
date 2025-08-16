export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  stargazers_count: number
  language: string | null
  topics: string[]
  pushed_at: string
  created_at: string
  updated_at: string
  owner: {
    login: string
    avatar_url: string
  }
  size: number
  open_issues_count: number
  forks_count: number
  archived: boolean
  disabled: boolean
  visibility: string
}

export interface SearchFilters {
  language?: string
  minStars?: number
  maxStars?: number
  topics?: string[]
  dateRange?: {
    from?: string
    to?: string
  }
}

export interface SearchResult {
  repo: GitHubRepo
  relevanceScore?: number
  matchedTerms?: string[]
}

export interface UserConfig {
  githubToken?: string
  openaiApiKey?: string
  theme: 'light' | 'dark'
}

export interface SearchMode {
  type: 'semantic' | 'keyword' | 'ai-query'
  label: string
  description: string
}