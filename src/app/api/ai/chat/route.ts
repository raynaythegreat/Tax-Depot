import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { prompt, context } = await request.json()

  const settings = await prisma.aISettings.findUnique({
    where: { userId: user.id },
  })

  if (!settings || !settings.enabled) {
    return NextResponse.json({ error: 'AI is not enabled' }, { status: 400 })
  }

  try {
    const endpoint = settings.provider === 'lmstudio'
      ? `${settings.apiUrl}/v1/chat/completions`
      : `${settings.apiUrl}/api/chat`

    const body: any = {
      model: settings.modelName,
      messages: [
        { role: 'system', content: context || 'You are a helpful tax and accounting assistant.' },
        { role: 'user', content: prompt },
      ],
      stream: false,
    }

    if (settings.provider === 'ollama') {
      body.format = 'json'
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120000),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('AI request failed:', response.status, errorText)
      throw new Error(`AI request failed: ${response.status}`)
    }

    const data = await response.json()
    const result = data.choices?.[0]?.message?.content || data.message?.content || 'No response'

    return NextResponse.json({ result })
  } catch (error: any) {
    console.error('AI chat error:', error)
    return NextResponse.json({ error: error.message || 'Failed to get AI response' }, { status: 500 })
  }
}
