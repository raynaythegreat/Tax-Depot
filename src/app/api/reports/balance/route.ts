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

  const accountWhere: any = { userId: user.id }
  if (clientId) {
    accountWhere.clientId = clientId
  }

  const accounts = await prisma.account.findMany({
    where: accountWhere,
  })

  const transactionWhere: any = {
    userId: user.id,
    date: { gte: startDate, lte: endDate },
  }
  if (clientId) {
    transactionWhere.clientId = clientId
  }

  const transactions = await prisma.transaction.findMany({
    where: transactionWhere,
    include: { category: true },
  })

  const assets: { category: string; amount: number }[] = []
  const liabilities: { category: string; amount: number }[] = []
  const equity: { category: string; amount: number }[] = []

  const cashBalance = accounts
    .filter((a) => a.type === 'bank' || a.type === 'cash')
    .reduce((sum, a) => sum + Number(a.balance), 0)

  if (cashBalance > 0) {
    assets.push({ category: 'Cash and Bank Accounts', amount: cashBalance })
  }

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const retainedEarnings = totalIncome - totalExpenses
  equity.push({ category: 'Retained Earnings', amount: Math.max(0, retainedEarnings) })
  equity.push({ category: 'Owner\'s Equity', amount: 0 })

  const creditCardBalance = accounts
    .filter((a) => a.type === 'credit_card')
    .reduce((sum, a) => sum + Number(a.balance), 0)

  if (creditCardBalance > 0) {
    liabilities.push({ category: 'Credit Cards', amount: creditCardBalance })
  }

  const totalAssets = assets.reduce((sum, a) => sum + a.amount, 0)
  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.amount, 0)
  const totalEquity = equity.reduce((sum, e) => sum + e.amount, 0)

  return NextResponse.json({
    assets,
    totalAssets: Math.round(totalAssets * 100) / 100,
    liabilities,
    totalLiabilities: Math.round(totalLiabilities * 100) / 100,
    equity,
    totalEquity: Math.round(totalEquity * 100) / 100,
    asOf: endDate.toISOString(),
  })
}
