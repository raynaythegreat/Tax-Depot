import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const clientId = formData.get('clientId') as string
    const taxYear = formData.get('taxYear') as string

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = path.join(process.cwd(), 'uploads', user.id)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filePath = path.join(uploadDir, fileName)

    await writeFile(filePath, buffer)

    let taxYearId = null
    if (clientId && taxYear) {
      const year = parseInt(taxYear)
      const existingYear = await prisma.taxYear.findFirst({
        where: {
          clientId,
          year,
        },
      })
      
      if (existingYear) {
        taxYearId = existingYear.id
      } else {
        const newYear = await prisma.taxYear.create({
          data: {
            clientId,
            year,
          },
        })
        taxYearId = newYear.id
      }
    }

    const document = await prisma.document.create({
      data: {
        userId: user.id,
        clientId: clientId || null,
        taxYearId,
        filename: fileName,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        path: filePath,
        type: getDocumentType(file.name),
        status: 'pending',
      },
    })

    return NextResponse.json({ document })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}

function getDocumentType(filename: string): 'bank_statement' | 'receipt' | 'invoice' | 'tax_form' | 'other' {
  const name = filename.toLowerCase()
  
  if (name.includes('statement') || name.includes('bank')) {
    return 'bank_statement'
  }
  if (name.includes('receipt')) {
    return 'receipt'
  }
  if (name.includes('invoice')) {
    return 'invoice'
  }
  if (name.includes('tax') || name.includes('w2') || name.includes('1099')) {
    return 'tax_form'
  }
  
  return 'other'
}
