'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  Sparkles, 
  Send, 
  Loader2,
  Settings,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Bot,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

function InsightsPage() {
  const searchParams = useSearchParams()
  const clientId = searchParams.get('client')
  const year = searchParams.get('year')

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiSettings, setAiSettings] = useState<any>(null)
  const [connected, setConnected] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    fetchAISettings()
  }, [])

  const fetchAISettings = async () => {
    try {
      const res = await fetch('/api/ai/settings')
      const data = await res.json()
      setAiSettings(data)
      setConnected(data.connected)
    } catch (error) {
      console.error('Failed to fetch AI settings:', error)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    let context = 'You are a helpful tax and accounting assistant.'
    if (clientId && year) {
      context += ` You are helping analyze data for client ID ${clientId}, tax year ${year}.`
    }

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input, context }),
      })

      const data = await res.json()

      if (data.error) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Error: ${data.error}`,
          timestamp: new Date(),
        }])
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.result,
          timestamp: new Date(),
        }])
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Failed to get response from AI',
        timestamp: new Date(),
      }])
    }

    setLoading(false)
  }

  const quickPrompts = [
    'Summarize my financial situation',
    'What are my top expenses?',
    'What tax deductions am I missing?',
    'Generate a report for this year',
    'Compare this year to last year',
    'What receipts should I keep?',
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Assistant</h1>
          <p className="text-muted-foreground">
            Ask questions about your finances or get AI-powered insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {connected ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {connected ? 'AI Connected' : 'AI Disconnected'}
          </div>
          <Button variant="outline" size="icon" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {showSettings && (
        <AISettingsPanel 
          settings={aiSettings} 
          onUpdate={fetchAISettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {clientId && year && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-3">
            <p className="text-sm text-blue-800">
              <strong>Active Context:</strong> Client {clientId}, Tax Year {year}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chat
              </CardTitle>
              <CardDescription>
                Ask me anything about your finances
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-gray-50 rounded-lg">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Ask me about your finances!</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Try one of the quick prompts below
                    </p>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-gray-100 dark:bg-gray-800'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p className="text-xs opacity-50 mt-1">
                          {msg.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Ask a question..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  disabled={loading}
                />
                <Button onClick={sendMessage} disabled={loading || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Prompts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickPrompts.map((prompt, i) => (
                <Button
                  key={i}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-2"
                  onClick={() => {
                    setInput(prompt)
                  }}
                  disabled={loading}
                >
                  <Sparkles className="h-4 w-4 mr-2 flex-shrink-0" />
                  {prompt}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Provider</span>
                <span className="font-medium">{aiSettings?.provider || 'Not set'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Model</span>
                <span className="font-medium">{aiSettings?.modelName || 'Not set'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Auto-categorize</span>
                <span className="font-medium">{aiSettings?.autoCategorize ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Auto-parse</span>
                <span className="font-medium">{aiSettings?.autoParse ? 'Enabled' : 'Disabled'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function AISettingsPanel({ settings, onUpdate, onClose }: { settings: any; onUpdate: () => void; onClose: () => void }) {
  const [formData, setFormData] = useState({
    provider: settings?.provider || 'ollama',
    modelName: settings?.modelName || 'llama3.2',
    apiUrl: settings?.apiUrl || 'http://localhost:11434',
    enabled: settings?.enabled ?? true,
    autoCategorize: settings?.autoCategorize ?? true,
    autoParse: settings?.autoParse ?? true,
    autoReconcile: settings?.autoReconcile ?? false,
    generateInsights: settings?.generateInsights ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/ai/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      onUpdate()
      onClose()
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
    setSaving(false)
  }

  const testConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch(formData.apiUrl + '/api/tags')
      if (res.ok) {
        setTestResult({ success: true, message: 'Connected successfully!' })
      } else {
        setTestResult({ success: false, message: `Failed: ${res.status}` })
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Connection failed' })
    }
    setTesting(false)
  }

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>AI Configuration</CardTitle>
          <CardDescription>Configure your local AI model</CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">Provider</label>
            <select
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2"
            >
              <option value="ollama">Ollama</option>
              <option value="lmstudio">LM Studio</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">API URL</label>
            <Input
              value={formData.apiUrl}
              onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
              placeholder="http://localhost:11434"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Model Name</label>
            <Input
              value={formData.modelName}
              onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
              placeholder="llama3.2"
            />
          </div>
          <div className="flex items-end">
            <Button 
              variant="outline" 
              onClick={testConnection}
              disabled={testing}
              className="w-full"
            >
              {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Test Connection
            </Button>
          </div>
        </div>

        {testResult && (
          <div className={`p-3 rounded-md ${testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {testResult.message}
          </div>
        )}

        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Enable AI</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.autoCategorize}
              onChange={(e) => setFormData({ ...formData, autoCategorize: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Auto-categorize transactions</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.autoParse}
              onChange={(e) => setFormData({ ...formData, autoParse: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Auto-parse documents</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.autoReconcile}
              onChange={(e) => setFormData({ ...formData, autoReconcile: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Auto-reconcile transactions</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.generateInsights}
              onChange={(e) => setFormData({ ...formData, generateInsights: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Generate AI insights</span>
          </label>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Save Settings
        </Button>
      </CardContent>
    </Card>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InsightsPage />
    </Suspense>
  )
}
