import { prisma } from './db'

export type AIProvider = 'ollama' | 'lmstudio'

export interface AISettings {
  provider: AIProvider
  modelName: string
  apiUrl: string
  enabled: boolean
  autoCategorize: boolean
  autoParse: boolean
  autoReconcile: boolean
  generateInsights: boolean
}

export interface TransactionCategorization {
  category: string
  confidence: number
  reasoning: string
}

export interface DocumentAnalysis {
  documentType: string
  extractedData: Record<string, any>
  summary: string
  keyInsights: string[]
}

export interface FinancialInsight {
  type: 'warning' | 'opportunity' | 'info'
  title: string
  description: string
  impact?: string
}

const DEFAULT_SETTINGS: AISettings = {
  provider: 'ollama',
  modelName: 'llama3.2',
  apiUrl: 'http://localhost:11434',
  enabled: true,
  autoCategorize: true,
  autoParse: true,
  autoReconcile: false,
  generateInsights: true,
}

export async function getAISettings(userId: string): Promise<AISettings> {
  const settings = await prisma.aISettings.findUnique({
    where: { userId },
  })
  
  if (!settings) {
    return DEFAULT_SETTINGS
  }
  
  return {
    provider: settings.provider as AIProvider,
    modelName: settings.modelName,
    apiUrl: settings.apiUrl,
    enabled: settings.enabled,
    autoCategorize: settings.autoCategorize,
    autoParse: settings.autoParse,
    autoReconcile: settings.autoReconcile,
    generateInsights: settings.generateInsights,
  }
}

export async function saveAISettings(userId: string, settings: Partial<AISettings>): Promise<AISettings> {
  const updated = await prisma.aISettings.upsert({
    where: { userId },
    create: {
      userId,
      ...settings,
    },
    update: settings,
  })
  
  return {
    provider: updated.provider as AIProvider,
    modelName: updated.modelName,
    apiUrl: updated.apiUrl,
    enabled: updated.enabled,
    autoCategorize: updated.autoCategorize,
    autoParse: updated.autoParse,
    autoReconcile: updated.autoReconcile,
    generateInsights: updated.generateInsights,
  }
}

export async function checkAIConnection(settings: AISettings): Promise<{ connected: boolean; error?: string }> {
  try {
    const endpoint = settings.provider === 'lmstudio' 
      ? `${settings.apiUrl}/v1/models`
      : `${settings.apiUrl}/api/tags`
    
    console.log(`Checking AI connection: ${endpoint}`)
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),
    })
    
    if (response.ok) {
      return { connected: true }
    } else {
      return { connected: false, error: `Server returned ${response.status}` }
    }
  } catch (error: any) {
    console.error('AI connection error:', error)
    const errorMsg = error.cause?.code === 'ECONNREFUSED' 
      ? 'Connection refused - is the server running?' 
      : error.message || 'Unknown error'
    return { connected: false, error: errorMsg }
  }
}

export async function getAvailableModels(settings: AISettings): Promise<string[]> {
  try {
    if (settings.provider === 'lmstudio') {
      const response = await fetch(`${settings.apiUrl}/v1/models`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000),
      })
      
      if (!response.ok) return []
      
      const data = await response.json()
      return data.data?.map((m: any) => m.id) || []
    } else {
      const response = await fetch(`${settings.apiUrl}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000),
      })
      
      if (!response.ok) return []
      
      const data = await response.json()
      return data.models?.map((m: any) => m.name) || []
    }
  } catch {
    return []
  }
}

export async function generateWithAI(
  prompt: string,
  settings: AISettings,
  systemPrompt?: string
): Promise<string> {
  try {
    const body: any = {
      model: settings.modelName,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt },
      ],
      stream: false,
    }

    const endpoint = settings.provider === 'lmstudio'
      ? `${settings.apiUrl}/v1/chat/completions`
      : `${settings.apiUrl}/api/chat/completions`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120000),
    })

    if (!response.ok) {
      throw new Error(`AI request failed: ${response.status}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || ''
  } catch (error) {
    console.error('AI generation error:', error)
    throw error
  }
}

export async function categorizeTransaction(
  description: string,
  amount: number,
  categories: string[],
  settings: AISettings
): Promise<TransactionCategorization> {
  if (!settings.enabled || !settings.autoCategorize) {
    return {
      category: 'Uncategorized',
      confidence: 0,
      reasoning: 'AI disabled',
    }
  }

  const systemPrompt = `You are a financial transaction categorizer. Analyze the transaction and categorize it into one of these categories: ${categories.join(', ')}.
  
Respond ONLY with a JSON object in this exact format:
{"category": "Category Name", "confidence": 0.95, "reasoning": "Short explanation"}`

  const prompt = `Categorize this transaction:
- Description: "${description}"
- Amount: $${Math.abs(amount).toFixed(2)}
- Type: ${amount >= 0 ? 'Income' : 'Expense'}`

  try {
    const result = await generateWithAI(prompt, settings, systemPrompt)
    const parsed = JSON.parse(result)
    return {
      category: parsed.category || 'Uncategorized',
      confidence: parsed.confidence || 0.5,
      reasoning: parsed.reasoning || 'AI categorization',
    }
  } catch {
    return {
      category: 'Uncategorized',
      confidence: 0,
      reasoning: 'AI failed to respond',
    }
  }
}

export async function analyzeDocument(
  extractedText: string,
  documentType: string,
  settings: AISettings
): Promise<DocumentAnalysis> {
  if (!settings.enabled || !settings.autoParse) {
    return {
      documentType: 'unknown',
      extractedData: {},
      summary: 'AI analysis disabled',
      keyInsights: [],
    }
  }

  const systemPrompt = `You are a financial document analyzer. Analyze the extracted text from a ${documentType} and extract key information.

Respond ONLY with a JSON object in this exact format:
{
  "documentType": "bank_statement|receipt|invoice|tax_form|other",
  "extractedData": {
    "key": "value"
  },
  "summary": "2-3 sentence summary",
  "keyInsights": ["insight1", "insight2", "insight3"]
}`

  try {
    const result = await generateWithAI(extractedText, settings, systemPrompt)
    const parsed = JSON.parse(result)
    return {
      documentType: parsed.documentType || 'other',
      extractedData: parsed.extractedData || {},
      summary: parsed.summary || '',
      keyInsights: parsed.keyInsights || [],
    }
  } catch {
    return {
      documentType: 'other',
      extractedData: {},
      summary: 'AI analysis failed',
      keyInsights: [],
    }
  }
}

export async function generateFinancialInsights(
  transactions: any[],
  settings: AISettings
): Promise<FinancialInsight[]> {
  if (!settings.enabled || !settings.generateInsights) {
    return []
  }

  const systemPrompt = `You are a financial advisor. Analyze the transaction data and provide actionable insights.

Respond ONLY with a JSON array of insights in this exact format:
[{"type": "warning|opportunity|info", "title": "Title", "description": "Description", "impact": "Impact"}]`

  const summary = `
Total Transactions: ${transactions.length}
Total Income: $${transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
Total Expenses: $${transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}

Sample Transactions:
${transactions.slice(0, 20).map(t => `- ${t.date}: ${t.description} - $${t.amount} (${t.type})`).join('\n')}
  `.trim()

  try {
    const result = await generateWithAI(summary, settings, systemPrompt)
    const parsed = JSON.parse(result)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function reconcileTransactions(
  transactions: any[],
  settings: AISettings
): Promise<{ matches: [string, string][], suggestions: string[] }> {
  if (!settings.enabled || !settings.autoReconcile) {
    return { matches: [], suggestions: [] }
  }

  const systemPrompt = `You are an accounting assistant. Find matching transactions that should be reconciled (e.g., same amount, opposite types, within a few days).

Respond ONLY with a JSON object in this exact format:
{"matches": [["transactionId1", "transactionId2"]], "suggestions": ["suggestion1", "suggestion2"]}`

  const transactionData = transactions.map(t => ({
    id: t.id,
    date: t.date,
    description: t.description,
    amount: t.amount,
    type: t.type,
    isReconciled: t.isReconciled,
  }))

  try {
    const result = await generateWithAI(JSON.stringify(transactionData), settings, systemPrompt)
    const parsed = JSON.parse(result)
    return {
      matches: parsed.matches || [],
      suggestions: parsed.suggestions || [],
    }
  } catch {
    return { matches: [], suggestions: [] }
  }
}
