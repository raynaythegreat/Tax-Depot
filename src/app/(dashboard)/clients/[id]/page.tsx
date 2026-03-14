'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Plus, 
  FileText, 
  Upload, 
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  DollarSign,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface TaxYear {
  id: string
  year: number
  status: string
  notes: string | null
  documents: Document[]
  _count: { documents: number }
}

interface Document {
  id: string
  originalName: string
  type: string
  status: string
  createdAt: string
}

interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  taxYears: TaxYear[]
}

function ClientDetail() {
  const params = useParams()
  const searchParams = useSearchParams()
  const clientId = params.id as string
  const initialYear = searchParams.get('year')
  
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [showAddYear, setShowAddYear] = useState(false)
  const [newYear, setNewYear] = useState('')

  useEffect(() => {
    fetchClient()
  }, [clientId])

  useEffect(() => {
    if (initialYear) {
      setSelectedYear(parseInt(initialYear))
    }
  }, [initialYear])

  const fetchClient = async () => {
    try {
      const res = await fetch(`/api/clients/${clientId}`)
      const data = await res.json()
      setClient(data)
      if (data.taxYears.length > 0 && !selectedYear) {
        setSelectedYear(data.taxYears[0].year)
      }
    } catch (error) {
      console.error('Failed to fetch client:', error)
    }
    setLoading(false)
  }

  const addTaxYear = async () => {
    if (!newYear) return
    
    try {
      await fetch(`/api/clients/${clientId}/tax-years`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: parseInt(newYear) }),
      })
      setNewYear('')
      setShowAddYear(false)
      fetchClient()
    } catch (error) {
      console.error('Failed to add tax year:', error)
    }
  }

  const deleteTaxYear = async (yearId: string) => {
    if (!confirm('Delete this tax year and all its documents?')) return
    
    try {
      await fetch(`/api/clients/${clientId}/tax-years/${yearId}`, { method: 'DELETE' })
      fetchClient()
    } catch (error) {
      console.error('Failed to delete tax year:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'filed':
        return <CheckCircle className="h-4 w-4 text-purple-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed'
      case 'in_progress': return 'In Progress'
      case 'filed': return 'Filed'
      default: return 'Pending'
    }
  }

  const currentTaxYear = client?.taxYears.find(ty => ty.year === selectedYear)

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!client) {
    return <div className="text-center py-12">Client not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{client.name}</h1>
          <p className="text-muted-foreground">
            {client.email} {client.phone && `• ${client.phone}`}
          </p>
        </div>
        <Link href={`/documents?client=${client.id}${selectedYear ? `&year=${selectedYear}` : ''}`}>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4 overflow-x-auto pb-2">
        {client.taxYears.sort((a, b) => b.year - a.year).map((ty) => (
          <button
            key={ty.id}
            onClick={() => setSelectedYear(ty.year)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors whitespace-nowrap ${
              selectedYear === ty.year 
                ? 'bg-primary text-primary-foreground border-primary' 
                : 'bg-background hover:bg-gray-100'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span className="font-medium">{ty.year}</span>
            {getStatusIcon(ty.status)}
          </button>
        ))}
        
        {showAddYear ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Year"
              value={newYear}
              onChange={(e) => setNewYear(e.target.value)}
              className="w-24 px-3 py-2 rounded-md border text-sm"
              min="2000"
              max="2100"
            />
            <Button size="sm" onClick={addTaxYear}>Add</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAddYear(false)}>Cancel</Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setShowAddYear(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Year
          </Button>
        )}
      </div>

      {currentTaxYear ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Tax Year {currentTaxYear.year}</CardTitle>
                    <CardDescription>
                      {currentTaxYear._count.documents} documents
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={currentTaxYear.status}
                      onChange={async (e) => {
                        await fetch(`/api/clients/${clientId}/tax-years/${currentTaxYear.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: e.target.value }),
                        })
                        fetchClient()
                      }}
                      className="px-3 py-1 rounded-md border text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="filed">Filed</option>
                    </select>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500"
                      onClick={() => deleteTaxYear(currentTaxYear.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {currentTaxYear.documents.length > 0 ? (
                  <div className="space-y-2">
                    {currentTaxYear.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium">{doc.originalName}</p>
                            <p className="text-xs text-gray-500">
                              {doc.type} • {new Date(doc.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          doc.status === 'processed' ? 'bg-green-100 text-green-800' :
                          doc.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {doc.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No documents for {currentTaxYear.year}</p>
                    <Link href={`/documents?client=${client.id}&year=${currentTaxYear.year}`}>
                      <Button variant="outline" className="mt-4">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Documents
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transactions</CardTitle>
                <CardDescription>All transactions for {currentTaxYear.year}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={`/transactions?client=${client.id}&year=${currentTaxYear.year}`}>
                  <Button variant="outline" className="w-full">
                    View Transactions
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Documents</span>
                  <span className="font-medium">{currentTaxYear._count.documents}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className="font-medium">{getStatusLabel(currentTaxYear.status)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/reports?client=${client.id}&year=${currentTaxYear.year}`} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </Link>
                <Link href={`/insights?client=${client.id}&year=${currentTaxYear.year}`} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <DollarSign className="h-4 w-4 mr-2" />
                    AI Insights
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">Select or add a tax year</p>
            <Button onClick={() => setShowAddYear(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tax Year
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function ClientDetailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientDetail />
    </Suspense>
  )
}
