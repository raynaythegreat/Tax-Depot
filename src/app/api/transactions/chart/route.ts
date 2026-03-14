import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  }

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  sixMonthsAgo.setDate(1)

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: {
        gte: sixMonthsAgo,
      },
    },
  })

  const monthData: Record<string, { income: number; expenses: number }> = {}

  transactions.forEach((transaction) => {
    const month = transaction.date.toLocaleString('default', { month: 'short', year: 'numeric' })
    
    if (!monthData[month]) {
      monthData[month] = { income: 0, expenses: 0 }
    }

    if (transaction.type === 'income') {
      monthData[month].income += Number(transaction.amount)
    } else if (transaction.type === 'expense') {
      monthData[month].expenses += Number(transaction.amount)
    }
  })

  const chartData = Object.entries(monthData)
    .map(([month, data]) => ({
      month,
      income: Math.round(data.income * 100) / 100,
      expenses: Math.round(data.expenses * 100) / 100,
    }))
    .slice(-6)

  return NextResponse.json(chartData)
}
