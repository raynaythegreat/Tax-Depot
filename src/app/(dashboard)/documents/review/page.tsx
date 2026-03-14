'use client'

import { useState, useEffect } from 'react'
import { 
  FileText, 
  Check, 
  X, 
  Edit, 
  Trash2, 
  Eye,
  Upload,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  ZoomIn,
  ZoomOut,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Transaction {
  id: string
  date: string
  amount: number
  type: string
  description: string
  payee: string | null
  category: { id: string; name: string; color: string | null } | null
  aiCategory: string | null
  aiConfidence: number | null
}

interface Document {
  id: string
  originalName: string
  type: string
  status: string
  path: string
  extractedText: string | null
  confidence: number | null
  aiAnalysis: string | null
  client: { id: string; name: string } | null
  taxYear: { id: string; year: number } | null
  transactions: Transaction[]
}

interface Category {
  id: string
  name: string
  type: string
  color: string | null
}

export default function DocumentReviewPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [processing, setProcessing] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [filter, setFilter] = useState<'pending' | 'processed' | 'all'>('pending')

  useEffect(() => {
    fetchDocuments()
    fetchCategories()
  }, [])

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`/api/documents?status=${filter}`)
      const data = await res.json()
      setDocuments(data)
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    }
    setLoading(false)
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      setCategories(data)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const approveTransaction = async (transactionId: string) => {
    try {
      await fetch(`/api/transactions/${transactionId}/approve`, { method: 'POST' })
      fetchDocuments()
    } catch (error) {
      console.error('Failed to approve transaction:', error)
    }
  }

  const rejectTransaction = async (transactionId: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return
    
    try {
      await fetch(`/api/transactions/${transactionId}`, { method: 'DELETE' })
      fetchDocuments()
    } catch (error) {
      console.error('Failed to reject transaction:', error)
    }
  }

  const updateTransaction = async (transactionId: string, data: any) => {
    try {
      await fetch(`/api/transactions/${transactionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      setEditingTransaction(null)
      fetchDocuments()
    } catch (error) {
      console.error('Failed to update transaction:', error)
    }
  }

  const processWithAI = async (documentId: string) => {
    setProcessing(true)
    try {
      await fetch(`/api/documents/${documentId}/process`, { method: 'POST' })
      fetchDocuments()
    } catch (error) {
      console.error('Failed to process document:', error)
    }
    setProcessing(false)
  }

  const filteredDocs = documents.filter(d => 
    filter === 'all' || d.status === filter
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Document Review</h1>
          <p className="text-muted-foreground">
            Review and approve extracted transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('pending')}
          >
            Pending ({documents.filter(d => d.status === 'pending').length})
          </Button>
          <Button 
            variant={filter === 'processed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('processed')}
          >
            Processed ({documents.filter(d => d.status === 'processed').length})
          </Button>
          <Button 
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({documents.length})
          </Button>
        </div>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">No documents to review</p>
            <Button onClick={() => window.location.href = '/documents'}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Documents
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3 h-[calc(100vh-200px)]">
          {/* Document List */}
          <div className="lg:col-span-1 overflow-y-auto space-y-2 pr-2">
            {filteredDocs.map((doc) => (
              <Card 
                key={doc.id} 
                className={`cursor-pointer transition-all ${
                  selectedDoc?.id === doc.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => {
                  setSelectedDoc(doc)
                  setSelectedTransaction(null)
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{doc.originalName}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {doc.client?.name || 'No client'} • {doc.taxYear?.year || 'No year'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {doc.transactions.length} transactions
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      doc.status === 'processed' ? 'bg-green-100 text-green-800' :
                      doc.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Document Preview */}
          <div className="lg:col-span-1 bg-gray-100 rounded-lg overflow-hidden flex flex-col">
            <div className="p-3 bg-white border-b flex items-center justify-between">
              <h3 className="font-medium">Document Preview</h3>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs px-2">{Math.round(zoom * 100)}%</span>
                <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(2, z + 0.25))}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-200">
              {selectedDoc ? (
                <div 
                  className="bg-white shadow-lg p-8"
                  style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
                >
                  {selectedDoc.extractedText ? (
                    <pre className="text-xs whitespace-pre-wrap font-mono max-w-md">
                      {selectedDoc.extractedText}
                    </pre>
                  ) : (
                    <div className="text-center text-gray-400">
                      <FileText className="h-16 w-16 mx-auto mb-4" />
                      <p>No extracted text available</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => selectedDoc && processWithAI(selectedDoc.id)}
                        disabled={processing}
                      >
                        {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                        Process with AI
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-400">Select a document to preview</p>
              )}
            </div>
          </div>

          {/* Transaction List */}
          <div className="lg:col-span-1 overflow-y-auto">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Transactions</CardTitle>
                  {selectedDoc && selectedDoc.status === 'pending' && (
                    <Button 
                      size="sm" 
                      onClick={() => processWithAI(selectedDoc.id)}
                      disabled={processing}
                    >
                      {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                      Re-process
                    </Button>
                  )}
                </div>
                <CardDescription>
                  {selectedDoc ? `${selectedDoc.transactions.length} transactions extracted` : 'Select a document'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {!selectedDoc ? (
                  <p className="text-gray-400 text-center py-8">Select a document to view transactions</p>
                ) : selectedDoc.transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No transactions extracted</p>
                    <Button variant="outline" onClick={() => processWithAI(selectedDoc.id)} disabled={processing}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Extract Transactions
                    </Button>
                  </div>
                ) : (
                  selectedDoc.transactions.map((tx) => (
                    <div 
                      key={tx.id}
                      className={`p-3 rounded-lg border transition-all ${
                        selectedTransaction?.id === tx.id ? 'ring-2 ring-primary bg-primary/5' : ''
                      }`}
                      onClick={() => setSelectedTransaction(tx)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{tx.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(tx.date).toLocaleDateString()}
                            {tx.payee && ` • ${tx.payee}`}
                          </p>
                          {tx.aiCategory && (
                            <div className="flex items-center gap-1 mt-2">
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                AI: {tx.aiCategory} ({Math.round((tx.aiConfidence || 0) * 100)}%)
                              </span>
                            </div>
                          )}
                        </div>
                        <div className={`font-bold ${
                          tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
                        </div>
                      </div>
                      
                      {selectedTransaction?.id === tx.id && (
                        <div className="mt-3 pt-3 border-t space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Category:</span>
                            <select
                              value={tx.category?.id || ''}
                              onChange={(e) => updateTransaction(tx.id, { categoryId: e.target.value })}
                              className="text-xs border rounded px-2 py-1"
                            >
                              <option value="">Select category</option>
                              {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => setEditingTransaction(tx)}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="default"
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              onClick={() => approveTransaction(tx.id)}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => rejectTransaction(tx.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Edit Transaction</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Input
                  value={editingTransaction.description}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Amount</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingTransaction.amount}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, amount: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <Input
                    type="date"
                    value={editingTransaction.date.split('T')[0]}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Payee</label>
                <Input
                  value={editingTransaction.payee || ''}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, payee: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={editingTransaction.type}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, type: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <Button variant="outline" onClick={() => setEditingTransaction(null)}>Cancel</Button>
              <Button onClick={() => {
                updateTransaction(editingTransaction.id, editingTransaction)
              }}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
