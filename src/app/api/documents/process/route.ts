import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { processImage } from '@/lib/ocr'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fileName } = await request.json()

    if (!fileName) {
      return NextResponse.json({ error: 'Missing fileName' }, { status: 400 })
    }

    const document = await prisma.document.findFirst({
      where: {
        userId: user.id,
        originalName: fileName,
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    await prisma.document.update({
      where: { id: document.id },
      data: { status: 'processing' },
    })

    try {
      const fileBuffer = await readFile(document.path)
      const file = new File([fileBuffer], document.originalName, { type: document.mimeType })

      const result = await processImage(file)

      await prisma.document.update({
        where: { id: document.id },
        data: {
          extractedText: result.text,
          confidence: result.confidence,
          status: 'processed',
          processedAt: new Date(),
        },
      })

      let defaultCategory = await prisma.category.findFirst({
        where: {
          userId: user.id,
          name: 'Uncategorized',
        },
      })

      if (!defaultCategory) {
        defaultCategory = await prisma.category.create({
          data: {
            userId: user.id,
            name: 'Uncategorized',
            type: 'expense',
            color: '#6b7280',
          },
        })
      }

      const transactions = []
      for (const t of result.transactions) {
        const transaction = await prisma.transaction.create({
          data: {
            userId: user.id,
            documentId: document.id,
            categoryId: defaultCategory.id,
            date: t.date,
            amount: t.amount,
            type: t.type,
            description: t.description,
            payee: t.payee,
            reference: t.reference,
          },
        })
        transactions.push(transaction)
      }

      return NextResponse.json({
        document: {
          id: document.id,
          status: 'processed',
          confidence: result.confidence,
        },
        transactions: transactions.length,
      })
    } catch (processError) {
      console.error('Processing error:', processError)
      
      await prisma.document.update({
        where: { id: document.id },
        data: { status: 'error' },
      })

      return NextResponse.json(
        { error: 'Failed to process document' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Process error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
