'use client'

import { useState, useEffect } from 'react'
import { 
  Receipt, 
  Plus, 
  Search, 
  Printer,
  Trash2,
  Edit,
  FileText,
  Download,
  Eye,
  Building,
  Copy
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BusinessProfile, Invoice, InvoiceItem } from '@/types'

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null)
  const [clients, setClients] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [invoicesRes, profileRes, clientsRes] = await Promise.all([
        fetch('/api/invoices'),
        fetch('/api/business-profile'),
        fetch('/api/clients'),
      ])
      const invoicesData = await invoicesRes.json()
      const profileData = await profileRes.json()
      const clientsData = await clientsRes.json()
      setInvoices(invoicesData)
      setBusinessProfile(profileData)
      setClients(clientsData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
    setLoading(false)
  }

  const deleteInvoice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return
    try {
      await fetch(`/api/invoices/${id}`, { method: 'DELETE' })
      setInvoices(invoices.filter(i => i.id !== id))
    } catch (error) {
      console.error('Failed to delete invoice:', error)
    }
  }

  const filteredInvoices = invoices.filter(i => 
    i.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
    (i.client?.name && i.client.name.toLowerCase().includes(search.toLowerCase()))
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'sent': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount)
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString()
  }

  const handlePrint = () => {
    window.print()
  }

  if (viewingInvoice) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between print:hidden">
          <div>
            <h1 className="text-3xl font-bold">
              {viewingInvoice.type === 'receipt' ? 'Receipt' : 'Invoice'}: {viewingInvoice.invoiceNumber}
            </h1>
            <p className="text-muted-foreground">
              Created on {formatDate(viewingInvoice.createdAt)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setViewingInvoice(null)}>
              Back
            </Button>
            <Button variant="outline" onClick={() => setEditingInvoice(viewingInvoice)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        <InvoicePrintView 
          invoice={viewingInvoice} 
          businessProfile={businessProfile}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {!businessProfile?.businessName && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Set up your business profile</strong> to customize your invoices and receipts with your business name, logo, and contact information.{' '}
              <a href="/settings" className="underline font-medium">Go to Settings →</a>
            </p>
          </CardContent>
        </Card>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoices & Receipts</h1>
          <p className="text-muted-foreground">Create and manage invoices and receipts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setEditingInvoice(null); setShowModal(true); }}>
            <Receipt className="h-4 w-4 mr-2" />
            New Receipt
          </Button>
          <Button onClick={() => { setEditingInvoice(null); setShowModal(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : filteredInvoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">No invoices or receipts yet</p>
            <Button onClick={() => setShowModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Invoice
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredInvoices.map((invoice) => (
            <Card key={invoice.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${invoice.type === 'receipt' ? 'bg-green-100' : 'bg-blue-100'}`}>
                      {invoice.type === 'receipt' ? (
                        <Receipt className="h-5 w-5 text-green-600" />
                      ) : (
                        <FileText className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{invoice.invoiceNumber}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {invoice.client?.name || 'No client'} • {formatDate(invoice.issueDate)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(invoice.total, invoice.currency)}</div>
                      <div className="text-sm text-gray-500">{invoice.items.length} items</div>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setViewingInvoice(invoice)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setEditingInvoice(invoice)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-red-500"
                        onClick={() => deleteInvoice(invoice.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {(showModal || editingInvoice) && (
        <InvoiceModal
          invoice={editingInvoice}
          businessProfile={businessProfile}
          clients={clients}
          onClose={() => {
            setShowModal(false)
            setEditingInvoice(null)
          }}
          onSave={(invoice) => {
            fetchData()
            setShowModal(false)
            setEditingInvoice(null)
            setViewingInvoice(invoice)
          }}
        />
      )}
    </div>
  )
}

function InvoiceModal({ 
  invoice, 
  businessProfile, 
  clients, 
  onClose, 
  onSave 
}: { 
  invoice: Invoice | null
  businessProfile: BusinessProfile | null
  clients: any[]
  onClose: () => void
  onSave: (invoice: Invoice) => void
}) {
  const [type, setType] = useState<'invoice' | 'receipt'>(invoice?.type || 'invoice')
  const [clientId, setClientId] = useState(invoice?.clientId || '')
  const [issueDate, setIssueDate] = useState(
    invoice?.issueDate ? new Date(invoice.issueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  )
  const [dueDate, setDueDate] = useState(
    invoice?.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : ''
  )
  const [taxRate, setTaxRate] = useState(invoice?.taxRate?.toString() || '0')
  const [notes, setNotes] = useState(invoice?.notes || '')
  const [terms, setTerms] = useState(invoice?.terms || businessProfile?.paymentTerms || '')
  const [items, setItems] = useState<InvoiceItem[]>(
    invoice?.items || [{ id: '', invoiceId: '', description: '', quantity: 1, unitPrice: 0, total: 0, sortOrder: 0 }]
  )
  const [saving, setSaving] = useState(false)

  const addItem = () => {
    setItems([...items, { 
      id: '', 
      invoiceId: '', 
      description: '', 
      quantity: 1, 
      unitPrice: 0, 
      total: 0, 
      sortOrder: items.length 
    }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].total = Number(newItems[index].quantity) * Number(newItems[index].unitPrice)
    }
    setItems(newItems)
  }

  const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0)
  const taxAmount = subtotal * (Number(taxRate) / 100)
  const total = subtotal + taxAmount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const method = invoice ? 'PUT' : 'POST'
      const url = invoice ? `/api/invoices/${invoice.id}` : '/api/invoices'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          clientId: clientId || null,
          issueDate,
          dueDate: dueDate || null,
          subtotal,
          taxRate: Number(taxRate),
          taxAmount,
          total,
          notes,
          terms,
          items: items.map((item, index) => ({
            description: item.description,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            total: Number(item.quantity) * Number(item.unitPrice),
            sortOrder: index,
          })),
        }),
      })

      if (res.ok) {
        const savedInvoice = await res.json()
        onSave(savedInvoice)
      }
    } catch (error) {
      console.error('Failed to save invoice:', error)
    }
    setSaving(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: businessProfile?.defaultCurrency || 'USD',
    }).format(amount)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-3xl mx-4 my-auto">
        <h2 className="text-xl font-bold mb-4">
          {invoice ? 'Edit' : 'Create'} {type === 'receipt' ? 'Receipt' : 'Invoice'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={type}
                onChange={(e) => setType(e.target.value as 'invoice' | 'receipt')}
              >
                <option value="invoice">Invoice</option>
                <option value="receipt">Receipt</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Client</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              >
                <option value="">Select a client (optional)</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Issue Date</label>
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Due Date</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Items</label>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="text-left p-2">Description</th>
                    <th className="text-center p-2 w-20">Qty</th>
                    <th className="text-center p-2 w-28">Price</th>
                    <th className="text-center p-2 w-28">Total</th>
                    <th className="p-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-2">
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          placeholder="Item description"
                          required
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                          className="text-center"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                          className="text-right"
                        />
                      </td>
                      <td className="p-2 text-right font-medium">
                        {formatCurrency(item.total)}
                      </td>
                      <td className="p-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tax Rate (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
              />
            </div>
            <div className="space-y-1 text-right">
              <div className="text-sm">Subtotal: <span className="font-medium">{formatCurrency(subtotal)}</span></div>
              <div className="text-sm">Tax ({taxRate}%): <span className="font-medium">{formatCurrency(taxAmount)}</span></div>
              <div className="text-lg font-bold">Total: {formatCurrency(total)}</div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Terms & Conditions</label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder="Payment terms, conditions..."
              rows={2}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : (invoice ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

const InvoicePrintView = ({ 
  invoice, 
  businessProfile 
}: { 
  invoice: Invoice
  businessProfile: BusinessProfile | null
}) => {
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount)
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: letter;
            margin: 0.75in;
          }
          html, body {
            height: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          .invoice-container {
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            background: white !important;
          }
          .invoice-content {
            min-height: auto !important;
            padding: 0 !important;
            border: none !important;
          }
        }
      `}</style>
      
      <div className="invoice-container bg-white dark:bg-gray-800 rounded-lg max-w-4xl mx-auto">
        <div className="invoice-content border rounded-lg p-8 md:p-12">
          {/* Header */}
          <div className="flex justify-between items-start mb-10 pb-6 border-b-2 border-gray-200">
            <div className="flex-1">
              {businessProfile?.logo ? (
                <img src={businessProfile.logo} alt="Logo" className="h-20 mb-4 object-contain" />
              ) : (
                <div className="w-20 h-20 bg-gray-800 rounded-lg flex items-center justify-center mb-4">
                  <Building className="h-10 w-10 text-white" />
                </div>
              )}
              <h1 className="text-3xl font-bold text-gray-900">{businessProfile?.businessName || 'Your Business'}</h1>
              {businessProfile?.legalName && businessProfile.legalName !== businessProfile.businessName && (
                <p className="text-base text-gray-600 mt-1">{businessProfile.legalName}</p>
              )}
              {businessProfile?.taxId && (
                <p className="text-sm text-gray-500 mt-1">Tax ID: {businessProfile.taxId}</p>
              )}
            </div>
            <div className="text-right">
              <h2 className="text-4xl font-bold text-gray-900 mb-3">
                {invoice.type === 'receipt' ? 'RECEIPT' : 'INVOICE'}
              </h2>
              <p className="text-xl font-semibold text-gray-700 mb-2">{invoice.invoiceNumber}</p>
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="font-medium">Date:</span> {formatDate(invoice.issueDate)}</p>
                {invoice.dueDate && <p><span className="font-medium">Due:</span> {formatDate(invoice.dueDate)}</p>}
                {invoice.paidAt && <p className="text-green-600 font-medium">Paid: {formatDate(invoice.paidAt)}</p>}
              </div>
            </div>
          </div>

          {/* From / To */}
          <div className="grid grid-cols-2 gap-12 mb-10">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">From</h3>
              <p className="text-lg font-semibold text-gray-900">{businessProfile?.businessName || 'Your Business'}</p>
              <div className="text-sm text-gray-600 space-y-1 mt-2">
                {businessProfile?.address && <p>{businessProfile.address}</p>}
                {(businessProfile?.city || businessProfile?.state || businessProfile?.zipCode) && (
                  <p>{businessProfile?.city}{businessProfile?.city && businessProfile?.state ? ', ' : ''}{businessProfile?.state} {businessProfile?.zipCode}</p>
                )}
                {businessProfile?.phone && <p>Phone: {businessProfile.phone}</p>}
                {businessProfile?.email && <p>Email: {businessProfile.email}</p>}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Bill To</h3>
              {invoice.client ? (
                <>
                  <p className="text-lg font-semibold text-gray-900">{invoice.client.name}</p>
                  <div className="text-sm text-gray-600 space-y-1 mt-2">
                    {invoice.client.address && <p>{invoice.client.address}</p>}
                    {invoice.client.phone && <p>Phone: {invoice.client.phone}</p>}
                    {invoice.client.email && <p>Email: {invoice.client.email}</p>}
                  </div>
                </>
              ) : (
                <p className="text-gray-400 italic">No client specified</p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-10">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Description</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider w-24">Qty</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider w-32">Unit Price</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider w-32">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="py-4 px-4 text-gray-800">{item.description}</td>
                    <td className="py-4 px-4 text-center text-gray-800">{item.quantity}</td>
                    <td className="py-4 px-4 text-right text-gray-800">{formatCurrency(item.unitPrice, invoice.currency)}</td>
                    <td className="py-4 px-4 text-right text-gray-800 font-medium">{formatCurrency(item.total, invoice.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-10">
            <div className="w-72">
              <div className="flex justify-between py-3 text-gray-600">
                <span>Subtotal:</span>
                <span className="font-medium">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
              </div>
              {invoice.taxRate > 0 && (
                <div className="flex justify-between py-3 text-gray-600 border-t border-gray-200">
                  <span>Tax ({invoice.taxRate}%):</span>
                  <span className="font-medium">{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
                </div>
              )}
              <div className="flex justify-between py-4 border-t-2 border-gray-900 font-bold text-xl text-gray-900">
                <span>Total:</span>
                <span>{formatCurrency(invoice.total, invoice.currency)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Notes</h3>
              <p className="text-sm text-gray-700 whitespace-pre-line">{invoice.notes}</p>
            </div>
          )}

          {/* Terms */}
          {invoice.terms && (
            <div className="mb-8">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Terms & Conditions</h3>
              <p className="text-sm text-gray-600 whitespace-pre-line">{invoice.terms}</p>
            </div>
          )}

          {/* Payment Info */}
          {businessProfile?.bankName && (
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Payment Information</h3>
              <div className="text-sm text-gray-700 space-y-1">
                <p><span className="font-medium">Bank:</span> {businessProfile.bankName}</p>
                {businessProfile.bankAccount && <p><span className="font-medium">Account:</span> {businessProfile.bankAccount}</p>}
                {businessProfile.bankRouting && <p><span className="font-medium">Routing:</span> {businessProfile.bankRouting}</p>}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-auto pt-8 border-t-2 border-gray-200 text-center">
            <p className="text-lg font-medium text-gray-700 mb-1">Thank you for your business!</p>
            {businessProfile?.website && <p className="text-sm text-gray-500">{businessProfile.website}</p>}
          </div>
        </div>
      </div>
    </>
  )
}
