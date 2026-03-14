import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const clientId = searchParams.get('clientId')
  const year = searchParams.get('year') || new Date().getFullYear().toString()

  const startDate = new Date(parseInt(year), 0, 1)
  const endDate = new Date(parseInt(year), 11, 31)

  const where: any = {
    userId: user.id,
    date: { gte: startDate, lte: endDate },
  }

  if (clientId) {
    where.clientId = clientId
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: { category: true },
  })

  const operatingActivities: { description: string; amount: number }[] = []
  const investingActivities: { description: string; amount: number }[] = []
  const financingActivities: { description: string; amount: number }[] = []

  const incomeByCategory: Record<string, number> = {}
  const expensesByCategory: Record<string, number> = {}

  transactions.forEach((t) => {
    const category = t.category?.name || 'Uncategorized'
    
    if (t.type === 'income') {
      incomeByCategory[category] = (incomeByCategory[category] || 0) + Number(t.amount)
    } else if (t.type === 'expense') {
      expensesByCategory[category] = (expensesByCategory[category] || 0) + Number(t.amount)
    }
  })

  Object.entries(incomeByCategory).forEach(([category, amount]) => {
    operatingActivities.push({
      description: `Cash received from ${category.toLowerCase()}`,
      amount: Math.round(amount * 100) / 100,
    })
  })

  Object.entries(expensesByCategory).forEach(([category, amount]) => {
    operatingActivities.push({
      description: `Cash paid for ${category.toLowerCase()}`,
      amount: -Math.round(amount * 100) / 100,
    })
  })

  operatingActivities.push({
    description: 'Net income adjustment',
    amount: 0,
  })

  const totalOperating = operatingActivities.reduce((sum, a) => sum + a.amount, 0)
  const totalInvesting = investingActivities.reduce((sum, a) => sum + a.amount, 0)
  const totalFinancing = financingActivities.reduce((sum, a) => sum + a.amount, 0)
  const netCashFlow = totalOperating + totalInvesting + totalFinancing

  return NextResponse.json({
    operatingActivities,
    totalOperating: Math.round(totalOperating * 100) / 100,
    investingActivities,
    totalInvesting: Math.round(totalInvesting * 100) / 100,
    financingActivities,
    totalFinancing: Math.round(totalFinancing * 100) / 100,
    netCashFlow: Math.round(netCashFlow * 100) / 100,
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
  })
}
