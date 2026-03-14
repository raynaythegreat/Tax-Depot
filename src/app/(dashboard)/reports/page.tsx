'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Download, FileText, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Client {
  id: string
  name: string
}

interface Report {
  revenue: { category: string; amount: number }[]
  totalRevenue: number
  expenses: { category: string; amount: number }[]
  totalExpenses: number
  netProfit: number
  period: { start: string; end: string }
}

interface BalanceSheet {
  assets: { category: string; amount: number }[]
  totalAssets: number
  liabilities: { category: string; amount: number }[]
  totalLiabilities: number
  equity: { category: string; amount: number }[]
  totalEquity: number
  asOf: string
}

interface CashFlow {
  operatingActivities: { description: string; amount: number }[]
  totalOperating: number
  investingActivities: { description: string; amount: number }[]
  totalInvesting: number
  financingActivities: { description: string; amount: number }[]
  totalFinancing: number
  netCashFlow: number
  period: { start: string; end: string }
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const [pAndLReport, setPAndLReport] = useState<Report | null>(null)
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null)
  const [cashFlow, setCashFlow] = useState<CashFlow | null>(null)

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients')
      const data = await res.json()
      setClients(data)
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    }
  }

  const generateReport = async (type: 'pl' | 'balance' | 'cashflow') => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedClient) params.set('clientId', selectedClient)
      params.set('year', selectedYear)
      
      const res = await fetch(`/api/reports/${type}?${params}`)
      const data = await res.json()
      
      if (type === 'pl') setPAndLReport(data)
      else if (type === 'balance') setBalanceSheet(data)
      else if (type === 'cashflow') setCashFlow(data)
    } catch (error) {
      console.error('Error generating report:', error)
    }
    setLoading(false)
  }

  const exportToCSV = (data: any, filename: string) => {
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(data)
    const link = document.createElement('a')
    link.setAttribute('href', csvContent)
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">
          Generate financial reports for your business
        </p>
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-1">Client</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
              >
                <option value="">All Clients</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
            <div className="min-w-[120px]">
              <label className="block text-sm font-medium mb-1">Tax Year</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {[2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <Button onClick={() => generateReport('pl')} disabled={loading}>
              Generate Reports
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="pl" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pl">Profit & Loss</TabsTrigger>
          <TabsTrigger value="balance">Balance Sheet</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
        </TabsList>

        <TabsContent value="pl">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Profit & Loss Statement</CardTitle>
                  <CardDescription>
                    {pAndLReport
                      ? `${format(new Date(pAndLReport.period.start), 'MMM d, yyyy')} - ${format(new Date(pAndLReport.period.end), 'MMM d, yyyy')}`
                      : 'Generate a P&L report for your business'}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => generateReport('pl')} disabled={loading}>
                    Generate Report
                  </Button>
                  {pAndLReport && (
                    <Button variant="outline" onClick={() => exportToCSV(JSON.stringify(pAndLReport), 'profit-loss.csv')}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {pAndLReport ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-green-600">Revenue</h3>
                    <div className="space-y-2">
                      {pAndLReport.revenue.map((item, i) => (
                        <div key={i} className="flex justify-between py-2 border-b">
                          <span>{item.category}</span>
                          <span className="font-medium">${item.amount.toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between py-2 font-semibold bg-green-50 dark:bg-green-900/20 px-2 rounded">
                        <span>Total Revenue</span>
                        <span>${pAndLReport.totalRevenue.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-red-600">Expenses</h3>
                    <div className="space-y-2">
                      {pAndLReport.expenses.map((item, i) => (
                        <div key={i} className="flex justify-between py-2 border-b">
                          <span>{item.category}</span>
                          <span className="font-medium">${item.amount.toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between py-2 font-semibold bg-red-50 dark:bg-red-900/20 px-2 rounded">
                        <span>Total Expenses</span>
                        <span>${pAndLReport.totalExpenses.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between py-4 text-xl font-bold bg-primary/10 px-4 rounded-lg">
                    <span>Net Profit</span>
                    <span className={pAndLReport.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ${pAndLReport.netProfit.toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Click "Generate Report" to create a Profit & Loss statement</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Balance Sheet</CardTitle>
                  <CardDescription>
                    {balanceSheet
                      ? `As of ${format(new Date(balanceSheet.asOf), 'MMM d, yyyy')}`
                      : 'Generate a balance sheet for your business'}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => generateReport('balance')} disabled={loading}>
                    Generate Report
                  </Button>
                  {balanceSheet && (
                    <Button variant="outline" onClick={() => exportToCSV(JSON.stringify(balanceSheet), 'balance-sheet.csv')}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {balanceSheet ? (
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-blue-600">Assets</h3>
                    <div className="space-y-2">
                      {balanceSheet.assets.map((item, i) => (
                        <div key={i} className="flex justify-between py-2 border-b">
                          <span>{item.category}</span>
                          <span className="font-medium">${item.amount.toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between py-2 font-semibold bg-blue-50 dark:bg-blue-900/20 px-2 rounded">
                        <span>Total Assets</span>
                        <span>${balanceSheet.totalAssets.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-orange-600">Liabilities</h3>
                    <div className="space-y-2">
                      {balanceSheet.liabilities.map((item, i) => (
                        <div key={i} className="flex justify-between py-2 border-b">
                          <span>{item.category}</span>
                          <span className="font-medium">${item.amount.toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between py-2 font-semibold bg-orange-50 dark:bg-orange-900/20 px-2 rounded">
                        <span>Total Liabilities</span>
                        <span>${balanceSheet.totalLiabilities.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-purple-600">Equity</h3>
                    <div className="space-y-2">
                      {balanceSheet.equity.map((item, i) => (
                        <div key={i} className="flex justify-between py-2 border-b">
                          <span>{item.category}</span>
                          <span className="font-medium">${item.amount.toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between py-2 font-semibold bg-purple-50 dark:bg-purple-900/20 px-2 rounded">
                        <span>Total Equity</span>
                        <span>${balanceSheet.totalEquity.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Click "Generate Report" to create a Balance Sheet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cashflow">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Cash Flow Statement</CardTitle>
                  <CardDescription>
                    {cashFlow
                      ? `${format(new Date(cashFlow.period.start), 'MMM d, yyyy')} - ${format(new Date(cashFlow.period.end), 'MMM d, yyyy')}`
                      : 'Generate a cash flow statement for your business'}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => generateReport('cashflow')} disabled={loading}>
                    Generate Report
                  </Button>
                  {cashFlow && (
                    <Button variant="outline" onClick={() => exportToCSV(JSON.stringify(cashFlow), 'cash-flow.csv')}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {cashFlow ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-green-600">Operating Activities</h3>
                    <div className="space-y-2">
                      {cashFlow.operatingActivities.map((item, i) => (
                        <div key={i} className="flex justify-between py-2 border-b">
                          <span>{item.description}</span>
                          <span className="font-medium">${item.amount.toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between py-2 font-semibold bg-green-50 dark:bg-green-900/20 px-2 rounded">
                        <span>Net Operating Cash Flow</span>
                        <span>${cashFlow.totalOperating.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-blue-600">Investing Activities</h3>
                    <div className="space-y-2">
                      {cashFlow.investingActivities.map((item, i) => (
                        <div key={i} className="flex justify-between py-2 border-b">
                          <span>{item.description}</span>
                          <span className="font-medium">${item.amount.toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between py-2 font-semibold bg-blue-50 dark:bg-blue-900/20 px-2 rounded">
                        <span>Net Investing Cash Flow</span>
                        <span>${cashFlow.totalInvesting.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-purple-600">Financing Activities</h3>
                    <div className="space-y-2">
                      {cashFlow.financingActivities.map((item, i) => (
                        <div key={i} className="flex justify-between py-2 border-b">
                          <span>{item.description}</span>
                          <span className="font-medium">${item.amount.toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between py-2 font-semibold bg-purple-50 dark:bg-purple-900/20 px-2 rounded">
                        <span>Net Financing Cash Flow</span>
                        <span>${cashFlow.totalFinancing.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between py-4 text-xl font-bold bg-primary/10 px-4 rounded-lg">
                    <span>Net Cash Flow</span>
                    <span className={cashFlow.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ${cashFlow.netCashFlow.toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Click "Generate Report" to create a Cash Flow Statement</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
