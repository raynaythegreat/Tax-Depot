import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')

    const where: any = { userId: user.id }
    if (type) where.type = type
    if (status) where.status = status
    if (clientId) where.clientId = clientId

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true, email: true, phone: true, address: true },
        },
        items: {
          orderBy: { sortOrder: 'asc' },
        },
        businessProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(invoices)
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    let businessProfile = await prisma.businessProfile.findUnique({
      where: { userId: user.id },
    })

    if (!businessProfile) {
      businessProfile = await prisma.businessProfile.create({
        data: {
          userId: user.id,
          businessName: user.businessName || user.name || 'My Business',
        },
      })
    }

    const prefix = data.type === 'receipt' 
      ? businessProfile.receiptPrefix 
      : businessProfile.invoicePrefix
    const number = data.type === 'receipt'
      ? businessProfile.receiptNumber
      : businessProfile.invoiceNumber

    const invoiceNumber = `${prefix}-${number}`

    const invoice = await prisma.invoice.create({
      data: {
        userId: user.id,
        clientId: data.clientId || null,
        businessProfileId: businessProfile.id,
        invoiceNumber,
        type: data.type || 'invoice',
        status: data.status || 'draft',
        issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        subtotal: data.subtotal || 0,
        taxRate: data.taxRate || 0,
        taxAmount: data.taxAmount || 0,
        total: data.total || 0,
        currency: data.currency || businessProfile.defaultCurrency || 'USD',
        notes: data.notes,
        terms: data.terms,
        items: {
          create: (data.items || []).map((item: any, index: number) => ({
            description: item.description,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            total: item.total || (item.quantity || 1) * (item.unitPrice || 0),
            sortOrder: index,
          })),
        },
      },
      include: {
        client: true,
        items: true,
        businessProfile: true,
      },
    })

    if (data.type === 'receipt') {
      await prisma.businessProfile.update({
        where: { id: businessProfile.id },
        data: { receiptNumber: { increment: 1 } },
      })
    } else {
      await prisma.businessProfile.update({
        where: { id: businessProfile.id },
        data: { invoiceNumber: { increment: 1 } },
      })
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}
