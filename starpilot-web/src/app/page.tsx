'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Star, Settings, BookOpen, Github, Sparkles, Zap, RefreshCw, AlertCircle, CheckCircle2, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/components/ui/use-toast'
import { SettingsModal } from '@/components/settings-modal'
import { GitHubRepo, SearchResult, UserConfig } from '@/types'
import { formatStarCount, formatDate, truncateText } from '@/lib/utils'
import { StorageService, StoredSettings } from '@/lib/storage'
import { GitHubService } from '@/lib/github'
import { OpenAIService } from '@/lib/openai'

type SearchMode = 'semantic' | 'intelligent' | 'keyword'

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [allRepos, setAllRepos] = useState<GitHubRepo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingRepos, setIsLoadingRepos] = useState(false)
  const [searchMode, setSearchMode] = useState<SearchMode>('semantic')
  const [settings, setSettings] = useState<StoredSettings>({})
  const [hasSearched, setHasSearched] = useState(false)
  const { toast } = useToast()

  // Load settings and repos on mount
  useEffect(() => {
    const savedSettings = StorageService.loadSettings()
    setSettings(savedSettings)
    
    // Load cached repos if available
    const cachedRepos = StorageService.loadRepos()
    if (cachedRepos) {
      setAllRepos(cachedRepos)
    }
  }, [])

  // Fetch starred repositories
  const fetchStarredRepos = useCallback(async () => {
    if (!settings.githubToken) {
      toast({
        title: 'GitHub token required',
        description: 'Please configure your GitHub token in settings.',
        variant: 'destructive'
      })
      return
    }

    setIsLoadingRepos(true)
    try {
      const response = await fetch('/api/github/starred?all=true', {
        headers: {
          'Authorization': `Bearer ${settings.githubToken}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch repositories')
      }

      const repos = await response.json()
      setAllRepos(repos)
      StorageService.saveRepos(repos)
      
      toast({
        title: 'Repositories updated',
        description: `Loaded ${repos.length} starred repositories.`
      })
    } catch (error) {
      console.error('Error fetching repos:', error)
      toast({
        title: 'Error fetching repositories',
        description: 'Please check your GitHub token and try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoadingRepos(false)
    }
  }, [settings.githubToken, toast])

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: 'Empty search query',
        description: 'Please enter a search term before searching.',
        variant: 'destructive'
      })
      return
    }

    if (allRepos.length === 0) {
      toast({
        title: 'No repositories loaded',
        description: 'Please fetch your starred repositories first.',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)
    setHasSearched(true)
    
    try {
      let results: SearchResult[]
      
      if (searchMode === 'keyword') {
        // Simple keyword search
        const filtered = allRepos.filter(repo => {
          const searchableText = [
            repo.name,
            repo.description || '',
            repo.language || '',
            ...repo.topics,
            repo.owner.login
          ].join(' ').toLowerCase()
          
          return searchableText.includes(searchQuery.toLowerCase())
        }).map(repo => ({ repo, relevanceScore: 1 }))
        
        results = filtered.slice(0, 20)
      } else {
        // AI-powered search
        if (!settings.openaiApiKey) {
          toast({
            title: 'OpenAI API key required',
            description: 'Please configure your OpenAI API key for AI-powered search.',
            variant: 'destructive'
          })
          return
        }
        
        const endpoint = searchMode === 'semantic' ? '/api/search/semantic' : '/api/search/intelligent'
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: searchQuery,
            repos: allRepos,
            apiKey: settings.openaiApiKey
          })
        })
        
        if (!response.ok) {
          throw new Error('Search failed')
        }
        
        results = await response.json()
      }
      
      setSearchResults(results)
    } catch (error) {
      console.error('Search error:', error)
      toast({
        title: 'Search failed',
        description: 'There was an error performing the search. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleSettingsUpdate = (newSettings: StoredSettings) => {
    setSettings(newSettings)
    StorageService.saveSettings(newSettings)
  }

  const getSearchModeDescription = (mode: SearchMode) => {
    switch (mode) {
      case 'semantic':
        return 'AI-powered semantic search using embeddings'
      case 'intelligent':
        return 'Advanced AI query understanding and filtering'
      case 'keyword':
        return 'Simple text-based keyword matching'
    }
  }

  const getSearchModeIcon = (mode: SearchMode) => {
    switch (mode) {
      case 'semantic':
        return <Sparkles className="h-4 w-4" />
      case 'intelligent':
        return <Zap className="h-4 w-4" />
      case 'keyword':
        return <Search className="h-4 w-4" />
    }
  }

  const isConfigured = settings.githubToken && settings.openaiApiKey
  const hasRepos = allRepos.length > 0

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Star className="h-8 w-8 text-primary" />
                  <h1 className="text-2xl font-bold text-foreground">Starpilot</h1>
                  <Badge variant="secondary" className="ml-2">Web</Badge>
                </div>
                {hasRepos && (
                  <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
                    <Database className="h-4 w-4" />
                    <span>{allRepos.length} repositories</span>
                    <span>•</span>
                    <span>Cache: {StorageService.formatCacheAge()}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {hasRepos && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchStarredRepos}
                    disabled={isLoadingRepos}
                  >
                    {isLoadingRepos ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    <span className="ml-2 hidden sm:inline">Refresh</span>
                  </Button>
                )}
                <SettingsModal onSettingsUpdate={handleSettingsUpdate}>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                  </Button>
                </SettingsModal>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          {/* Status Banner */}
          {!isConfigured && (
            <div className="mb-8">
              <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-200">
                        Configuration Required
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        Please configure your GitHub token and OpenAI API key to get started.
                      </p>
                    </div>
                    <SettingsModal onSettingsUpdate={handleSettingsUpdate}>
                      <Button variant="outline" size="sm" className="ml-auto">
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                    </SettingsModal>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {isConfigured && !hasRepos && (
            <div className="mb-8">
              <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="font-medium text-blue-800 dark:text-blue-200">
                        Load Your Starred Repositories
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Fetch your starred repositories to start searching.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchStarredRepos}
                      disabled={isLoadingRepos}
                      className="ml-auto"
                    >
                      {isLoadingRepos ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Database className="h-4 w-4 mr-2" />
                      )}
                      {isLoadingRepos ? 'Loading...' : 'Load Repositories'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              AI-Powered GitHub Stars Search
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Rediscover your GitHub stars with intelligent semantic search. 
              Find relevant repositories from your starred collection using natural language queries.
            </p>
          </div>

          {/* Search Section */}
          {hasRepos && (
            <div className="max-w-4xl mx-auto mb-8">
              <Card className="card-gradient">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        {getSearchModeIcon(searchMode)}
                        <span>Search Your Stars</span>
                      </CardTitle>
                      <CardDescription>
                        {getSearchModeDescription(searchMode)}
                      </CardDescription>
                    </div>
                    <Select value={searchMode} onValueChange={(value: SearchMode) => setSearchMode(value)}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="semantic">
                          <div className="flex items-center space-x-2">
                            <Sparkles className="h-4 w-4" />
                            <span>Semantic</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="intelligent">
                          <div className="flex items-center space-x-2">
                            <Zap className="h-4 w-4" />
                            <span>Intelligent</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="keyword">
                          <div className="flex items-center space-x-2">
                            <Search className="h-4 w-4" />
                            <span>Keyword</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      <div className="flex-1">
                        <Input
                          placeholder={searchMode === 'keyword' ? 'Enter keywords...' : 'Ask a natural language question...'}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="text-lg h-12"
                          disabled={isLoading}
                        />
                      </div>
                      <Button 
                        onClick={handleSearch}
                        disabled={isLoading || !searchQuery.trim() || (searchMode !== 'keyword' && !settings.openaiApiKey)}
                        className="h-12 px-8"
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Searching...
                          </>
                        ) : (
                          <>
                            {getSearchModeIcon(searchMode)}
                            <span className="ml-2">Search</span>
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p className="mb-1">
                        <strong>Example queries:</strong>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          'machine learning frameworks',
                          'React component libraries',
                          'data visualization tools',
                          'API testing utilities'
                        ].map((example) => (
                          <Button
                            key={example}
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setSearchQuery(example)}
                            disabled={isLoading}
                          >
                            {example}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Results Section */}
          {searchResults.length > 0 && (
            <div className="max-w-6xl mx-auto">
              <div className="mb-6">
                <h3 className="text-2xl font-semibold text-foreground mb-2">
                  Search Results
                </h3>
                <p className="text-muted-foreground">
                  Found {searchResults.length} relevant repositories
                  {searchMode !== 'keyword' && ' sorted by relevance'}
                </p>
              </div>

              <div className="grid gap-6">
                {searchResults.map((result) => {
                  const repo = result.repo
                  return (
                    <Card key={repo.id} className="hover:shadow-lg transition-all duration-200 glass-effect">
                      <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Github className="h-5 w-5 text-muted-foreground" />
                              <a 
                                href={repo.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xl font-semibold text-primary hover:underline"
                              >
                                {repo.full_name}
                              </a>
                              {result.relevanceScore && result.relevanceScore > 0.8 && (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  High Match
                                </Badge>
                              )}
                            </div>
                            
                            {repo.description && (
                              <p className="text-muted-foreground mb-4 leading-relaxed">
                                {truncateText(repo.description, 250)}
                              </p>
                            )}

                            <div className="flex flex-wrap gap-2 mb-4">
                              {repo.language && (
                                <Badge variant="secondary" className="font-medium">
                                  {repo.language}
                                </Badge>
                              )}
                              {repo.topics.slice(0, 6).map((topic) => (
                                <Badge key={topic} variant="outline">
                                  {topic}
                                </Badge>
                              ))}
                              {repo.topics.length > 6 && (
                                <Badge variant="outline">
                                  +{repo.topics.length - 6} more
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <div className="flex items-center space-x-1">
                                  <Star className="h-4 w-4" />
                                  <span>{formatStarCount(repo.stargazers_count)}</span>
                                </div>
                                <span>Updated {formatDate(repo.updated_at)}</span>
                              </div>
                              {result.relevanceScore && searchMode !== 'keyword' && (
                                <div className="text-xs text-muted-foreground">
                                  Relevance: {Math.round(result.relevanceScore * 100)}%
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {hasSearched && searchResults.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No results found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search query or using a different search mode.
              </p>
              <div className="flex justify-center space-x-2">
                <Button variant="outline" onClick={() => { setSearchQuery(''); setHasSearched(false) }}>
                  Clear Search
                </Button>
                <Button variant="outline" onClick={() => setSearchMode(searchMode === 'semantic' ? 'keyword' : 'semantic')}>
                  Try {searchMode === 'semantic' ? 'Keyword' : 'Semantic'} Search
                </Button>
              </div>
            </div>
          )}

          {/* Getting Started */}
          {!hasSearched && hasRepos && (
            <div className="max-w-4xl mx-auto">
              <Card className="card-gradient">
                <CardHeader>
                  <CardTitle>Ready to Search!</CardTitle>
                  <CardDescription>
                    You have {allRepos.length} starred repositories loaded. Try searching above.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">Semantic Search</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Uses AI embeddings to understand the meaning behind your queries.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Zap className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">Intelligent Query</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Advanced AI that understands context and can filter by specific criteria.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Search className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">Keyword Search</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Fast text-based search across repository names, descriptions, and topics.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
      <Toaster />
    </>
  )
}