'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Loader2, CheckCircle2, XCircle, FolderOpen, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface UploadedFile {
  id: string
  name: string
  size: number
  status: 'pending' | 'uploading' | 'processing' | 'done' | 'error'
  progress: number
  error?: string
}

interface SavedDocument {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  type: string
  status: string
  createdAt: string
  client?: { id: string; name: string } | null
  taxYear?: { id: string; year: number } | null
  transactions: { id: string }[]
}

interface Client {
  id: string
  name: string
  taxYears: { id: string; year: number }[]
}

export default function DocumentsPage() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [savedDocuments, setSavedDocuments] = useState<SavedDocument[]>([])
  const [loadingDocuments, setLoadingDocuments] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [totalProgress, setTotalProgress] = useState(0)
  const [estimatedTime, setEstimatedTime] = useState(0)

  useEffect(() => {
    fetchClients()
    fetchDocuments()
  }, [])

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients')
      const data = await res.json()
      setClients(data)
      if (data.length > 0) {
        setSelectedClient(data[0].id)
        if (data[0].taxYears.length > 0) {
          setSelectedYear(data[0].taxYears[0].year.toString())
        }
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    }
  }

  const fetchDocuments = async () => {
    setLoadingDocuments(true)
    try {
      const res = await fetch('/api/documents')
      const data = await res.json()
      setSavedDocuments(data)
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    }
    setLoadingDocuments(false)
  }

  const deleteDocument = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document? This will also delete associated transactions.')) return
    
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setSavedDocuments(savedDocuments.filter(d => d.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete document:', error)
    }
  }

  const removeFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id))
  }

  const currentClient = clients.find(c => c.id === selectedClient)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9) + Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      status: 'pending' as const,
      progress: 0,
    }))
    setFiles((prev) => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.tiff', '.bmp'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 10485760,
    multiple: true,
  })

  const uploadFiles = async () => {
    if (!selectedClient || !selectedYear) {
      alert('Please select a client and tax year first')
      return
    }

    const pendingFiles = files.filter(f => f.status === 'pending')
    if (pendingFiles.length === 0) return

    setUploading(true)
    setTotalProgress(0)
    
    const startTime = Date.now()
    let completed = 0

    for (const file of files) {
      if (file.status !== 'pending') continue

      setFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, status: 'uploading', progress: 0 } : f))
      )

      try {
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
        if (!fileInput?.files) continue

        const realFile = Array.from(fileInput.files).find((f) => f.name === file.name)
        if (!realFile) continue

        const formData = new FormData()
        formData.append('file', realFile)
        formData.append('clientId', selectedClient)
        formData.append('taxYear', selectedYear)

        const xhr = new XMLHttpRequest()

        await new Promise<void>((resolve, reject) => {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const progress = Math.round((e.loaded / e.total) * 100)
              setFiles((prev) =>
                prev.map((f) => (f.id === file.id ? { ...f, progress } : f))
              )
            }
          })

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              setFiles((prev) =>
                prev.map((f) => (f.id === file.id ? { ...f, status: 'done', progress: 100 } : f))
              )
              resolve()
            } else {
              reject(new Error('Upload failed'))
            }
          })

          xhr.addEventListener('error', () => reject(new Error('Upload failed')))
          xhr.addEventListener('abort', () => reject(new Error('Upload aborted')))

          xhr.open('POST', '/api/documents/upload')
          xhr.send(formData)
        })

        completed++
        const elapsed = (Date.now() - startTime) / 1000
        const avgTimePerFile = elapsed / completed
        const remaining = pendingFiles.length - completed
        setEstimatedTime(avgTimePerFile * remaining)
        setTotalProgress((completed / pendingFiles.length) * 100)

      } catch (error) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? { ...f, status: 'error', error: (error as Error).message }
              : f
          )
        )
      }
    }

    setUploading(false)
    setTotalProgress(100)
    fetchDocuments()
  }

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`
    return `${Math.round(seconds / 3600)}h`
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString()
  }

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'done':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-400" />
    }
  }

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case 'processed':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const pendingCount = files.filter(f => f.status === 'pending').length
  const completedCount = files.filter(f => f.status === 'done').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Documents</h1>
        <p className="text-muted-foreground">
          Upload bank statements and receipts for processing
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Client & Tax Year</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-1">Client</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={selectedClient}
                onChange={(e) => {
                  setSelectedClient(e.target.value)
                  const client = clients.find(c => c.id === e.target.value)
                  if (client && client.taxYears.length > 0) {
                    setSelectedYear(client.taxYears[0].year.toString())
                  }
                }}
              >
                {clients.length === 0 ? (
                  <option value="">No clients - create one first</option>
                ) : (
                  clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))
                )}
              </select>
            </div>
            <div className="min-w-[120px]">
              <label className="block text-sm font-medium mb-1">Tax Year</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {currentClient?.taxYears.map(ty => (
                  <option key={ty.id} value={ty.year}>{ty.year}</option>
                ))}
                {[2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]
                  .filter(y => !currentClient?.taxYears.some(ty => ty.year === y))
                  .map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
          <CardDescription>
            Drag and drop files or folders. Supports images (PNG, JPG) and PDFs up to 10MB each.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors',
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 dark:border-gray-600 hover:border-primary'
            )}
          >
            <input {...getInputProps()} />
            <FolderOpen className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            {isDragActive ? (
              <p className="text-primary font-medium text-lg">Drop files here...</p>
            ) : (
              <div>
                <p className="text-gray-600 dark:text-gray-300 font-medium text-lg">
                  Drag & drop files or folders here, or click to select
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  PNG, JPG, PDF up to 10MB each
                </p>
              </div>
            )}
          </div>

          {files.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  {completedCount} of {files.length} files processed
                </span>
                {uploading && estimatedTime > 0 && (
                  <span className="text-gray-500">
                    ~{formatTime(estimatedTime)} remaining
                  </span>
                )}
              </div>
              
              {uploading && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${totalProgress}%` }}
                  />
                </div>
              )}

              <div className="max-h-64 overflow-y-auto space-y-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md"
                  >
                    {getStatusIcon(file.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
                        {file.status === 'uploading' && file.progress > 0 && (
                          <div className="flex-1 max-w-[100px] bg-gray-200 rounded-full h-1">
                            <div 
                              className="bg-blue-500 h-1 rounded-full"
                              style={{ width: `${file.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                      {file.error && (
                        <p className="text-xs text-red-500">{file.error}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 capitalize">{file.status}</span>
                    {!uploading && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500"
                        onClick={() => removeFile(file.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={uploadFiles}
                  disabled={uploading || pendingCount === 0 || !selectedClient || !selectedYear}
                  className="flex-1"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing {pendingCount} files...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload {pendingCount} Files
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setFiles([])}
                  disabled={uploading}
                >
                  Clear All
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded Documents</CardTitle>
          <CardDescription>
            Previously uploaded documents and their processing status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingDocuments ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : savedDocuments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No documents uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {savedDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md"
                >
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.originalName}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{formatBytes(doc.size)}</span>
                      <span>•</span>
                      <span>{formatDate(doc.createdAt)}</span>
                      {doc.client && (
                        <>
                          <span>•</span>
                          <span>{doc.client.name}</span>
                        </>
                      )}
                      {doc.taxYear && (
                        <>
                          <span>•</span>
                          <span>Tax Year {doc.taxYear.year}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDocumentStatusColor(doc.status)}`}>
                      {doc.status}
                    </span>
                    {doc.transactions.length > 0 && (
                      <span className="text-xs text-gray-500">
                        {doc.transactions.length} transactions
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500"
                      onClick={() => deleteDocument(doc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
