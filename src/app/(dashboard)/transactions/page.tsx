import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import TransactionsList from '@/components/documents/TransactionsList'

async function getTransactions(userId: string) {
  return prisma.transaction.findMany({
    where: { userId },
    include: {
      category: true,
      account: true,
      document: true,
    },
    orderBy: { date: 'desc' },
    take: 100,
  })
}

async function getCategories(userId: string) {
  return prisma.category.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
  })
}

export default async function TransactionsPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    return null
  }

  const [transactions, categories] = await Promise.all([
    getTransactions(user.id),
    getCategories(user.id),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Transactions</h1>
        <p className="text-muted-foreground">
          View and manage your financial transactions
        </p>
      </div>

      <TransactionsList
        initialTransactions={transactions.map((t) => ({
          ...t,
          amount: Number(t.amount),
          type: t.type as 'income' | 'expense' | 'transfer' | 'adjustment',
        }))}
        categories={categories}
      />
    </div>
  )
}
