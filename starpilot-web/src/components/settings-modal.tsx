'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Settings, Eye, EyeOff, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { testGitHubToken } from '@/lib/github'
import { testOpenAIKey } from '@/lib/openai'

interface SettingsFormData {
  githubToken: string
  openaiApiKey: string
}

interface SettingsModalProps {
  children: React.ReactNode
  onSettingsUpdate?: (settings: SettingsFormData) => void
}

export function SettingsModal({ children, onSettingsUpdate }: SettingsModalProps) {
  const [open, setOpen] = useState(false)
  const [showGithubToken, setShowGithubToken] = useState(false)
  const [showOpenAIKey, setShowOpenAIKey] = useState(false)
  const [githubTokenStatus, setGithubTokenStatus] = useState<'idle' | 'testing' | 'valid' | 'invalid'>('idle')
  const [openAIKeyStatus, setOpenAIKeyStatus] = useState<'idle' | 'testing' | 'valid' | 'invalid'>('idle')
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<SettingsFormData>({
    defaultValues: {
      githubToken: '',
      openaiApiKey: ''
    }
  })

  const githubToken = watch('githubToken')
  const openaiApiKey = watch('openaiApiKey')

  // Load saved settings
  useEffect(() => {
    const savedSettings = localStorage.getItem('starpilot-settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setValue('githubToken', parsed.githubToken || '')
        setValue('openaiApiKey', parsed.openaiApiKey || '')
      } catch (error) {
        console.error('Error loading saved settings:', error)
      }
    }
  }, [setValue])

  // Test GitHub token when it changes
  useEffect(() => {
    if (githubToken && githubToken.length > 10) {
      setGithubTokenStatus('testing')
      const testToken = async () => {
        try {
          const isValid = await testGitHubToken(githubToken)
          setGithubTokenStatus(isValid ? 'valid' : 'invalid')
        } catch {
          setGithubTokenStatus('invalid')
        }
      }
      const timeoutId = setTimeout(testToken, 500)
      return () => clearTimeout(timeoutId)
    } else {
      setGithubTokenStatus('idle')
    }
  }, [githubToken])

  // Test OpenAI key when it changes
  useEffect(() => {
    if (openaiApiKey && openaiApiKey.length > 10) {
      setOpenAIKeyStatus('testing')
      const testKey = async () => {
        try {
          const isValid = await testOpenAIKey(openaiApiKey)
          setOpenAIKeyStatus(isValid ? 'valid' : 'invalid')
        } catch {
          setOpenAIKeyStatus('invalid')
        }
      }
      const timeoutId = setTimeout(testKey, 500)
      return () => clearTimeout(timeoutId)
    } else {
      setOpenAIKeyStatus('idle')
    }
  }, [openaiApiKey])

  const onSubmit = async (data: SettingsFormData) => {
    try {
      // Save to localStorage
      localStorage.setItem('starpilot-settings', JSON.stringify(data))
      
      // Call the callback if provided
      onSettingsUpdate?.(data)
      
      toast({
        title: "Settings saved",
        description: "Your API keys have been saved successfully.",
      })
      
      setOpen(false)
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: "There was a problem saving your settings. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = (status: typeof githubTokenStatus) => {
    switch (status) {
      case 'testing':
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'invalid':
        return <XCircle className="h-4 w-4 text-destructive" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: typeof githubTokenStatus) => {
    switch (status) {
      case 'testing':
        return <Badge variant="secondary">Testing...</Badge>
      case 'valid':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Valid</Badge>
      case 'invalid':
        return <Badge variant="destructive">Invalid</Badge>
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </DialogTitle>
          <DialogDescription>
            Configure your API keys to enable GitHub repository search and AI-powered features.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* GitHub Token Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">GitHub Personal Access Token</CardTitle>
              <CardDescription>
                Required to fetch your starred repositories. Needs 'user:read' scope permission.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="githubToken">Token</Label>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(githubTokenStatus)}
                    {getStatusIcon(githubTokenStatus)}
                  </div>
                </div>
                <div className="relative">
                  <Input
                    id="githubToken"
                    type={showGithubToken ? 'text' : 'password'}
                    placeholder="ghp_..."
                    {...register('githubToken', {
                      required: 'GitHub token is required',
                      minLength: {
                        value: 10,
                        message: 'Token must be at least 10 characters'
                      }
                    })}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowGithubToken(!showGithubToken)}
                  >
                    {showGithubToken ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.githubToken && (
                  <p className="text-sm text-destructive">{errors.githubToken.message}</p>
                )}
                <div className="text-sm text-muted-foreground">
                  <p>To create a token:</p>
                  <ol className="list-decimal list-inside space-y-1 mt-2">
                    <li>Go to <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GitHub Settings → Developer settings → Personal access tokens</a></li>
                    <li>Click "Generate new token (classic)"</li>
                    <li>Select the "user" scope (read:user)</li>
                    <li>Copy the generated token</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* OpenAI API Key Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">OpenAI API Key</CardTitle>
              <CardDescription>
                Required for AI-powered semantic search and intelligent query understanding.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="openaiApiKey">API Key</Label>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(openAIKeyStatus)}
                    {getStatusIcon(openAIKeyStatus)}
                  </div>
                </div>
                <div className="relative">
                  <Input
                    id="openaiApiKey"
                    type={showOpenAIKey ? 'text' : 'password'}
                    placeholder="sk-..."
                    {...register('openaiApiKey', {
                      required: 'OpenAI API key is required',
                      minLength: {
                        value: 10,
                        message: 'API key must be at least 10 characters'
                      }
                    })}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                  >
                    {showOpenAIKey ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.openaiApiKey && (
                  <p className="text-sm text-destructive">{errors.openaiApiKey.message}</p>
                )}
                <div className="text-sm text-muted-foreground">
                  <p>To get your API key:</p>
                  <ol className="list-decimal list-inside space-y-1 mt-2">
                    <li>Go to <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OpenAI API Keys</a></li>
                    <li>Click "Create new secret key"</li>
                    <li>Copy the generated key (it will only be shown once)</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || githubTokenStatus === 'invalid' || openAIKeyStatus === 'invalid'}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}