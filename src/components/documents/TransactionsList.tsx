'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  Search,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Category } from '@prisma/client'

interface Transaction {
  id: string
  date: Date
  amount: number
  type: 'income' | 'expense' | 'transfer' | 'adjustment'
  description: string
  payee: string | null
  category: { id: string; name: string; color: string | null } | null
  document: { originalName: string } | null
}

interface Props {
  initialTransactions: Transaction[]
  categories: Category[]
}

export default function TransactionsList({ initialTransactions, categories }: Props) {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  const filteredTransactions = initialTransactions.filter((t) => {
    const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase()) ||
                          (t.payee && t.payee.toLowerCase().includes(search.toLowerCase()))
    const matchesType = filterType === 'all' || t.type === filterType
    return matchesSearch && matchesType
  })

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage)

  const totalIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalIncome - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${(totalIncome - totalExpenses).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search transactions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('all')}
              >
                All
              </Button>
              <Button
                variant={filterType === 'income' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('income')}
              >
                Income
              </Button>
              <Button
                variant={filterType === 'expense' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('expense')}
              >
                Expenses
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium text-sm text-gray-500">Date</th>
                  <th className="text-left py-3 px-2 font-medium text-sm text-gray-500">Description</th>
                  <th className="text-left py-3 px-2 font-medium text-sm text-gray-500">Category</th>
                  <th className="text-right py-3 px-2 font-medium text-sm text-gray-500">Amount</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-500">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-2 text-sm">
                        {format(new Date(transaction.date), 'MMM d, yyyy')}
                      </td>
                      <td className="py-3 px-2">
                        <div className="text-sm font-medium">{transaction.description}</div>
                        {transaction.payee && (
                          <div className="text-xs text-gray-500">{transaction.payee}</div>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        {transaction.category ? (
                          <span
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: transaction.category.color || '#6b7280',
                              color: '#fff',
                            }}
                          >
                            {transaction.category.name}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Uncategorized</span>
                        )}
                      </td>
                      <td className={`py-3 px-2 text-right font-medium ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}$
                        {transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
