import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const invoice = await prisma.invoice.findFirst({
      where: { id, userId: user.id },
      include: {
        client: {
          select: { id: true, name: true, email: true, phone: true, address: true },
        },
        items: {
          orderBy: { sortOrder: 'asc' },
        },
        businessProfile: true,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const data = await request.json()

    const existingInvoice = await prisma.invoice.findFirst({
      where: { id, userId: user.id },
    })

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (data.items) {
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId: id },
      })
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        clientId: data.clientId,
        status: data.status,
        issueDate: data.issueDate ? new Date(data.issueDate) : undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        subtotal: data.subtotal,
        taxRate: data.taxRate,
        taxAmount: data.taxAmount,
        total: data.total,
        currency: data.currency,
        notes: data.notes,
        terms: data.terms,
        paidAt: data.status === 'paid' && !existingInvoice.paidAt ? new Date() : undefined,
        items: data.items ? {
          create: data.items.map((item: any, index: number) => ({
            description: item.description,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            total: item.total || (item.quantity || 1) * (item.unitPrice || 0),
            sortOrder: index,
          })),
        } : undefined,
      },
      include: {
        client: true,
        items: true,
        businessProfile: true,
      },
    })

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const invoice = await prisma.invoice.findFirst({
      where: { id, userId: user.id },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    await prisma.invoiceItem.deleteMany({
      where: { invoiceId: id },
    })

    await prisma.invoice.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    )
  }
}
