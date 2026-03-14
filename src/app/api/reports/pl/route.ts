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
    date: {
      gte: startDate,
      lte: endDate,
    },
  }

  if (clientId) {
    where.clientId = clientId
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      category: true,
    },
  })

  const revenueByCategory: Record<string, number> = {}
  const expensesByCategory: Record<string, number> = {}

  transactions.forEach((t) => {
    const category = t.category?.name || 'Uncategorized'
    const amount = Number(t.amount)

    if (t.type === 'income') {
      revenueByCategory[category] = (revenueByCategory[category] || 0) + amount
    } else if (t.type === 'expense') {
      expensesByCategory[category] = (expensesByCategory[category] || 0) + amount
    }
  })

  const revenue = Object.entries(revenueByCategory).map(([category, amount]) => ({
    category,
    amount: Math.round(amount * 100) / 100,
  }))

  const expenses = Object.entries(expensesByCategory).map(([category, amount]) => ({
    category,
    amount: Math.round(amount * 100) / 100,
  }))

  const totalRevenue = revenue.reduce((sum, r) => sum + r.amount, 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const netProfit = totalRevenue - totalExpenses

  return NextResponse.json({
    revenue,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    expenses,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    netProfit: Math.round(netProfit * 100) / 100,
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
  })
}
