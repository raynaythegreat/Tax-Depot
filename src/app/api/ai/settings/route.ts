import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getAISettings, saveAISettings, checkAIConnection, getAvailableModels } from '@/lib/ai'

export async function GET() {
  const user = await getCurrentUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const settings = await getAISettings(user.id)
  const connectionResult = await checkAIConnection(settings)
  const models = connectionResult.connected ? await getAvailableModels(settings) : []

  return NextResponse.json({ 
    ...settings, 
    connected: connectionResult.connected, 
    connectionError: connectionResult.error,
    availableModels: models 
  })
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const data = await request.json()
  const settings = await saveAISettings(user.id, data)
  
  const connectionResult = await checkAIConnection(settings)
  const models = connectionResult.connected ? await getAvailableModels(settings) : []

  return NextResponse.json({ 
    ...settings, 
    connected: connectionResult.connected,
    connectionError: connectionResult.error,
    availableModels: models 
  })
}
