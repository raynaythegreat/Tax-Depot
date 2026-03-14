'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  MoreVertical,
  FileText,
  Trash2,
  Edit,
  FolderOpen
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  taxYears: { id: string; year: number; status: string }[]
  _count: { documents: number; transactions: number }
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

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
    setLoading(false)
  }

  const deleteClient = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client? This will also delete all associated documents and transactions.')) return
    
    try {
      await fetch(`/api/clients/${id}`, { method: 'DELETE' })
      setClients(clients.filter(c => c.id !== id))
    } catch (error) {
      console.error('Failed to delete client:', error)
    }
  }

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'filed': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Manage your clients and their tax documents</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : filteredClients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">No clients found</p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Client
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{client.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Mail className="h-3 w-3" />
                      {client.email || 'No email'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => setEditingClient(client)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-red-500"
                      onClick={() => deleteClient(client.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {client.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    {client.phone}
                  </div>
                )}
                {client.address && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    {client.address.substring(0, 30)}...
                  </div>
                )}
                
                <div className="flex items-center gap-2 pt-2 border-t">
                  <FolderOpen className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">Tax Years:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {client.taxYears.length > 0 ? (
                    client.taxYears.slice(0, 3).map((ty) => (
                      <Link
                        key={ty.id}
                        href={`/clients/${client.id}?year=${ty.year}`}
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ty.status)}`}
                      >
                        {ty.year}
                      </Link>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">No tax years yet</span>
                  )}
                  {client.taxYears.length > 3 && (
                    <span className="text-xs text-gray-400">+{client.taxYears.length - 3} more</span>
                  )}
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t text-xs text-gray-500">
                  <span>{client._count.documents} documents</span>
                  <span>{client._count.transactions} transactions</span>
                </div>

                <Link href={`/clients/${client.id}`}>
                  <Button variant="outline" className="w-full mt-2">
                    <FileText className="h-4 w-4 mr-2" />
                    View Client
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {(showAddModal || editingClient) && (
        <ClientModal
          client={editingClient}
          onClose={() => {
            setShowAddModal(false)
            setEditingClient(null)
          }}
          onSave={() => {
            fetchClients()
            setShowAddModal(false)
            setEditingClient(null)
          }}
        />
      )}
    </div>
  )
}

function ClientModal({ client, onClose, onSave }: { client: Client | null; onClose: () => void; onSave: () => void }) {
  const [name, setName] = useState(client?.name || '')
  const [email, setEmail] = useState(client?.email || '')
  const [phone, setPhone] = useState(client?.phone || '')
  const [address, setAddress] = useState(client?.address || '')
  const [notes, setNotes] = useState(client?.notes || '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const method = client ? 'PUT' : 'POST'
      const url = client ? `/api/clients/${client.id}` : '/api/clients'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, address, notes }),
      })

      if (res.ok) {
        onSave()
      }
    } catch (error) {
      console.error('Failed to save client:', error)
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">{client ? 'Edit Client' : 'Add New Client'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Client Name *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Smith"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, City, State"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this client..."
              rows={3}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Client'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
