'use client'

import { useState, useEffect } from 'react'
import { User, Building2, Shield, Sparkles, Loader2, CheckCircle, AlertCircle, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface AISettings {
  provider: string
  modelName: string
  apiUrl: string
  enabled: boolean
  autoCategorize: boolean
  autoParse: boolean
  autoReconcile: boolean
  generateInsights: boolean
  connected: boolean
  connectionError?: string
  availableModels: string[]
}

interface BusinessProfile {
  id: string
  businessName: string
  legalName: string | null
  taxId: string | null
  email: string | null
  phone: string | null
  website: string | null
  address: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  country: string | null
  logo: string | null
  bankName: string | null
  bankAccount: string | null
  bankRouting: string | null
  paymentTerms: string | null
  invoicePrefix: string
  invoiceNumber: number
  receiptPrefix: string
  receiptNumber: number
  defaultCurrency: string
  notes: string | null
}

export default function SettingsPage() {
  const [name, setName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  
  const [aiSettings, setAiSettings] = useState<AISettings | null>(null)
  const [aiLoading, setAiLoading] = useState(true)
  const [aiSaving, setAiSaving] = useState(false)
  const [aiMessage, setAiMessage] = useState('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null)

  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null)
  const [businessLoading, setBusinessLoading] = useState(true)
  const [businessSaving, setBusinessSaving] = useState(false)
  const [businessMessage, setBusinessMessage] = useState('')

  const defaultAPIUrls: Record<string, string> = {
    ollama: 'http://localhost:11434',
    lmstudio: 'http://localhost:1234'
  }

  const fetchModelsForProvider = async (provider: string, apiUrl: string) => {
    setTesting(true)
    setTestResult(null)
    try {
      const endpoint = provider === 'lmstudio' 
        ? `${apiUrl}/v1/models`
        : `${apiUrl}/api/tags`
      
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000),
      })
      
      if (res.ok) {
        const data = await res.json()
        const models = provider === 'lmstudio'
          ? (data.data?.map((m: any) => m.id) || [])
          : (data.models?.map((m: any) => m.name) || [])
        setAiSettings(prev => prev ? { ...prev, availableModels: models, connected: true, apiUrl } : null)
        setTestResult({ success: true, message: `Found ${models.length} models!` })
      } else {
        setAiSettings(prev => prev ? { ...prev, connected: false, availableModels: [], apiUrl } : null)
        setTestResult({ success: false, message: `Failed: ${res.status} ${res.statusText}` })
      }
    } catch (error: any) {
      const errorMsg = error.name === 'TimeoutError' 
        ? 'Connection timed out'
        : error.cause?.code === 'ECONNREFUSED'
        ? 'Connection refused - is the server running?'
        : 'Connection failed - is the server running?'
      setAiSettings(prev => prev ? { ...prev, connected: false, availableModels: [], apiUrl } : null)
      setTestResult({ success: false, message: errorMsg })
    }
    setTesting(false)
  }

  const fetchAISettings = async () => {
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/settings')
      if (res.ok) {
        const data = await res.json()
        setAiSettings(data)
      } else {
        setAiSettings({
          provider: 'ollama',
          modelName: 'llama3.2',
          apiUrl: 'http://localhost:11434',
          enabled: true,
          autoCategorize: true,
          autoParse: true,
          autoReconcile: false,
          generateInsights: true,
          connected: false,
          availableModels: []
        })
      }
    } catch (error) {
      console.error('Failed to fetch AI settings:', error)
      setAiSettings({
        provider: 'ollama',
        modelName: 'llama3.2',
        apiUrl: 'http://localhost:11434',
        enabled: true,
        autoCategorize: true,
        autoParse: true,
        autoReconcile: false,
        generateInsights: true,
        connected: false,
        availableModels: []
      })
    }
    setAiLoading(false)
  }

  const fetchBusinessProfile = async () => {
    setBusinessLoading(true)
    try {
      const res = await fetch('/api/business-profile')
      if (res.ok) {
        const data = await res.json()
        setBusinessProfile(data)
      } else {
        setBusinessProfile({
          id: '',
          businessName: '',
          legalName: null,
          taxId: null,
          email: null,
          phone: null,
          website: null,
          address: null,
          city: null,
          state: null,
          zipCode: null,
          country: null,
          logo: null,
          bankName: null,
          bankAccount: null,
          bankRouting: null,
          paymentTerms: null,
          invoicePrefix: 'INV',
          invoiceNumber: 1000,
          receiptPrefix: 'RCP',
          receiptNumber: 1000,
          defaultCurrency: 'USD',
          notes: null,
        })
      }
    } catch (error) {
      console.error('Failed to fetch business profile:', error)
    }
    setBusinessLoading(false)
  }

  const handleProviderChange = (provider: string) => {
    const newApiUrl = defaultAPIUrls[provider] || 'http://localhost:11434'
    setAiSettings(prev => prev ? { 
      ...prev, 
      provider, 
      apiUrl: newApiUrl,
      modelName: '',
      availableModels: [],
      connected: false
    } : null)
    fetchModelsForProvider(provider, newApiUrl)
  }

  useEffect(() => {
    fetchAISettings()
    fetchBusinessProfile()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    
    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, businessName }),
      })

      if (res.ok) {
        setMessage('Settings saved successfully!')
      } else {
        setMessage('Failed to save settings')
      }
    } catch (error) {
      setMessage('An error occurred')
    }
    
    setSaving(false)
  }

  const saveAISettings = async () => {
    if (!aiSettings) return
    setAiSaving(true)
    setAiMessage('')
    
    try {
      const res = await fetch('/api/ai/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiSettings),
      })

      if (res.ok) {
        setAiMessage('AI settings saved successfully!')
        fetchAISettings()
      } else {
        setAiMessage('Failed to save AI settings')
      }
    } catch (error) {
      setAiMessage('An error occurred')
    }
    
    setAiSaving(false)
  }

  const testConnection = async () => {
    if (!aiSettings) return
    setTesting(true)
    setTestResult(null)
    
    try {
      const endpoint = aiSettings.provider === 'lmstudio' 
        ? `${aiSettings.apiUrl}/v1/models`
        : `${aiSettings.apiUrl}/api/tags`
      
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000),
      })
      
      if (res.ok) {
        setTestResult({ success: true, message: 'Connected successfully!' })
        const data = await res.json()
        if (aiSettings.provider === 'lmstudio') {
          const models = data.data?.map((m: any) => m.id) || []
          setAiSettings(prev => prev ? { ...prev, availableModels: models, connected: true } : null)
        } else {
          const models = data.models?.map((m: any) => m.name) || []
          setAiSettings(prev => prev ? { ...prev, availableModels: models, connected: true } : null)
        }
      } else {
        setTestResult({ success: false, message: `Failed: ${res.status} ${res.statusText}` })
        setAiSettings(prev => prev ? { ...prev, connected: false, availableModels: [] } : null)
      }
    } catch (error: any) {
      const errorMsg = error.name === 'TimeoutError' 
        ? 'Connection timed out'
        : error.cause?.code === 'ECONNREFUSED'
        ? 'Connection refused - is the server running?'
        : 'Connection failed - check if server is running'
      setTestResult({ success: false, message: errorMsg })
      setAiSettings(prev => prev ? { ...prev, connected: false, availableModels: [] } : null)
    }
    setTesting(false)
  }

  const saveBusinessProfile = async () => {
    if (!businessProfile) return
    setBusinessSaving(true)
    setBusinessMessage('')
    
    try {
      const res = await fetch('/api/business-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(businessProfile),
      })

      if (res.ok) {
        setBusinessMessage('Business profile saved successfully!')
      } else {
        setBusinessMessage('Failed to save business profile')
      }
    } catch (error) {
      setBusinessMessage('An error occurred')
    }
    
    setBusinessSaving(false)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setBusinessProfile(prev => prev ? { ...prev, logo: reader.result as string } : null)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="ai">AI Configuration</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <CardTitle>Profile Settings</CardTitle>
              </div>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  placeholder="Your Business LLC"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </div>
              {message && (
                <p className={`text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                  {message}
                </p>
              )}
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  <CardTitle>AI Configuration</CardTitle>
                </div>
                {aiSettings && (
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                    aiSettings.connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {aiSettings.connected ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    {aiSettings.connected ? 'Connected' : 'Disconnected'}
                  </div>
                )}
              </div>
              <CardDescription>
                Configure your local AI model (Ollama or LM Studio) - All data stays local for privacy
              </CardDescription>
              {aiSettings?.connectionError && (
                <p className="text-sm text-red-600 mt-2">
                  <strong>Error:</strong> {aiSettings.connectionError}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {aiLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : aiSettings ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Provider</Label>
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                        value={aiSettings.provider}
                        onChange={(e) => handleProviderChange(e.target.value)}
                      >
                        <option value="ollama">Ollama</option>
                        <option value="lmstudio">LM Studio</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>API URL</Label>
                      <Input
                        value={aiSettings.apiUrl}
                        onChange={(e) => setAiSettings({ ...aiSettings, apiUrl: e.target.value })}
                        placeholder={defaultAPIUrls[aiSettings.provider] || 'http://localhost:11434'}
                      />
                      <p className="text-xs text-gray-500">
                        {aiSettings.provider === 'lmstudio' 
                          ? 'LM Studio default: http://localhost:1234'
                          : 'Ollama default: http://localhost:11434'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Model Name</Label>
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="sm"
                          onClick={() => aiSettings && fetchModelsForProvider(aiSettings.provider, aiSettings.apiUrl)}
                          disabled={testing}
                        >
                          <Loader2 className={`h-3 w-3 mr-1 ${testing ? 'animate-spin' : ''}`} />
                          Refresh
                        </Button>
                      </div>
                      {aiSettings?.availableModels && aiSettings.availableModels.length > 0 ? (
                        <select
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                          value={aiSettings.modelName}
                          onChange={(e) => setAiSettings({ ...aiSettings, modelName: e.target.value })}
                        >
                          {aiSettings.availableModels.map((model) => (
                            <option key={model} value={model}>{model}</option>
                          ))}
                        </select>
                      ) : (
                        <Input
                          value={aiSettings.modelName}
                          onChange={(e) => setAiSettings({ ...aiSettings, modelName: e.target.value })}
                          placeholder="llama3.2"
                        />
                      )}
                      {aiSettings?.availableModels && aiSettings.availableModels.length > 0 && (
                        <p className="text-xs text-gray-500">
                          {aiSettings.availableModels.length} models available
                        </p>
                      )}
                    </div>
                    <div className="flex items-end">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={testConnection}
                        disabled={testing}
                      >
                        {testing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Test Connection
                      </Button>
                    </div>
                  </div>

                  {testResult && (
                    <div className={`p-3 rounded-md ${testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {testResult.message}
                    </div>
                  )}

                  <div className="space-y-3 border-t pt-4">
                    <Label>AI Features (Local Processing)</Label>
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={aiSettings.enabled}
                          onChange={(e) => setAiSettings({ ...aiSettings, enabled: e.target.checked })}
                          className="rounded"
                        />
                        <span className="text-sm">Enable AI</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={aiSettings.autoCategorize}
                          onChange={(e) => setAiSettings({ ...aiSettings, autoCategorize: e.target.checked })}
                          className="rounded"
                        />
                        <span className="text-sm">Auto-categorize transactions</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={aiSettings.autoParse}
                          onChange={(e) => setAiSettings({ ...aiSettings, autoParse: e.target.checked })}
                          className="rounded"
                        />
                        <span className="text-sm">Auto-parse documents</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={aiSettings.autoReconcile}
                          onChange={(e) => setAiSettings({ ...aiSettings, autoReconcile: e.target.checked })}
                          className="rounded"
                        />
                        <span className="text-sm">Auto-reconcile transactions</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={aiSettings.generateInsights}
                          onChange={(e) => setAiSettings({ ...aiSettings, generateInsights: e.target.checked })}
                          className="rounded"
                        />
                        <span className="text-sm">Generate AI insights</span>
                      </label>
                    </div>
                  </div>

                  {aiMessage && (
                    <p className={`text-sm ${aiMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                      {aiMessage}
                    </p>
                  )}

                  <Button onClick={saveAISettings} disabled={aiSaving}>
                    {aiSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save AI Settings
                  </Button>
                </>
              ) : (
                <p className="text-gray-500">Failed to load AI settings</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business">
          {businessLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin" />
              </CardContent>
            </Card>
          ) : businessProfile ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    <CardTitle>Business Information</CardTitle>
                  </div>
                  <CardDescription>
                    Your business details for invoices and receipts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Business Name *</Label>
                      <Input
                        value={businessProfile.businessName}
                        onChange={(e) => setBusinessProfile({ ...businessProfile, businessName: e.target.value })}
                        placeholder="Your Business Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Legal Name</Label>
                      <Input
                        value={businessProfile.legalName || ''}
                        onChange={(e) => setBusinessProfile({ ...businessProfile, legalName: e.target.value })}
                        placeholder="Legal business name (if different)"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tax ID / EIN</Label>
                      <Input
                        value={businessProfile.taxId || ''}
                        onChange={(e) => setBusinessProfile({ ...businessProfile, taxId: e.target.value })}
                        placeholder="XX-XXXXXXX"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={businessProfile.email || ''}
                        onChange={(e) => setBusinessProfile({ ...businessProfile, email: e.target.value })}
                        placeholder="contact@yourbusiness.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={businessProfile.phone || ''}
                        onChange={(e) => setBusinessProfile({ ...businessProfile, phone: e.target.value })}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Website</Label>
                      <Input
                        value={businessProfile.website || ''}
                        onChange={(e) => setBusinessProfile({ ...businessProfile, website: e.target.value })}
                        placeholder="https://yourbusiness.com"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Address</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Street Address</Label>
                    <Input
                      value={businessProfile.address || ''}
                      onChange={(e) => setBusinessProfile({ ...businessProfile, address: e.target.value })}
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input
                        value={businessProfile.city || ''}
                        onChange={(e) => setBusinessProfile({ ...businessProfile, city: e.target.value })}
                        placeholder="City"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>State / Province</Label>
                      <Input
                        value={businessProfile.state || ''}
                        onChange={(e) => setBusinessProfile({ ...businessProfile, state: e.target.value })}
                        placeholder="State"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>ZIP / Postal Code</Label>
                      <Input
                        value={businessProfile.zipCode || ''}
                        onChange={(e) => setBusinessProfile({ ...businessProfile, zipCode: e.target.value })}
                        placeholder="12345"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Input
                      value={businessProfile.country || ''}
                      onChange={(e) => setBusinessProfile({ ...businessProfile, country: e.target.value })}
                      placeholder="United States"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Logo</CardTitle>
                  <CardDescription>Upload your business logo for invoices and receipts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    {businessProfile.logo ? (
                      <img 
                        src={businessProfile.logo} 
                        alt="Business Logo" 
                        className="h-20 w-auto border rounded-lg p-2"
                      />
                    ) : (
                      <div className="h-20 w-20 border-2 border-dashed rounded-lg flex items-center justify-center text-gray-400">
                        <Upload className="h-8 w-8" />
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <Button 
                        variant="outline" 
                        onClick={() => document.getElementById('logo-upload')?.click()}
                      >
                        Upload Logo
                      </Button>
                      {businessProfile.logo && (
                        <Button 
                          variant="ghost" 
                          className="ml-2 text-red-500"
                          onClick={() => setBusinessProfile({ ...businessProfile, logo: null })}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Information</CardTitle>
                  <CardDescription>Bank details to show on invoices (optional)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Bank Name</Label>
                      <Input
                        value={businessProfile.bankName || ''}
                        onChange={(e) => setBusinessProfile({ ...businessProfile, bankName: e.target.value })}
                        placeholder="First National Bank"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Account Number</Label>
                      <Input
                        value={businessProfile.bankAccount || ''}
                        onChange={(e) => setBusinessProfile({ ...businessProfile, bankAccount: e.target.value })}
                        placeholder="XXXXXXXXXX"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Routing Number</Label>
                      <Input
                        value={businessProfile.bankRouting || ''}
                        onChange={(e) => setBusinessProfile({ ...businessProfile, bankRouting: e.target.value })}
                        placeholder="XXXXXXXXX"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Terms</Label>
                    <Input
                      value={businessProfile.paymentTerms || ''}
                      onChange={(e) => setBusinessProfile({ ...businessProfile, paymentTerms: e.target.value })}
                      placeholder="Net 30, Due upon receipt, etc."
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Invoice & Receipt Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="space-y-2">
                      <Label>Invoice Prefix</Label>
                      <Input
                        value={businessProfile.invoicePrefix}
                        onChange={(e) => setBusinessProfile({ ...businessProfile, invoicePrefix: e.target.value })}
                        placeholder="INV"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Next Invoice #</Label>
                      <Input
                        type="number"
                        value={businessProfile.invoiceNumber}
                        onChange={(e) => setBusinessProfile({ ...businessProfile, invoiceNumber: parseInt(e.target.value) || 1000 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Receipt Prefix</Label>
                      <Input
                        value={businessProfile.receiptPrefix}
                        onChange={(e) => setBusinessProfile({ ...businessProfile, receiptPrefix: e.target.value })}
                        placeholder="RCP"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Next Receipt #</Label>
                      <Input
                        type="number"
                        value={businessProfile.receiptNumber}
                        onChange={(e) => setBusinessProfile({ ...businessProfile, receiptNumber: parseInt(e.target.value) || 1000 })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Default Currency</Label>
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                        value={businessProfile.defaultCurrency}
                        onChange={(e) => setBusinessProfile({ ...businessProfile, defaultCurrency: e.target.value })}
                      >
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="CAD">CAD - Canadian Dollar</option>
                        <option value="AUD">AUD - Australian Dollar</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {businessMessage && (
                <p className={`text-sm ${businessMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                  {businessMessage}
                </p>
              )}

              <Button onClick={saveBusinessProfile} disabled={businessSaving} size="lg">
                {businessSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : 'Save Business Profile'}
              </Button>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                Failed to load business profile
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <CardTitle>Security</CardTitle>
              </div>
              <CardDescription>
                Manage your account security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                />
              </div>
              <Button variant="outline">Change Password</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
