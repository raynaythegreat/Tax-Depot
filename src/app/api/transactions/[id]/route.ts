import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const transaction = await prisma.transaction.findUnique({
    where: { id: params.id, userId: user.id },
    include: {
      category: true,
      account: true,
      document: true,
      client: true,
    },
  })

  if (!transaction) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
  }

  return NextResponse.json(transaction)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const data = await request.json()

  const transaction = await prisma.transaction.update({
    where: { id: params.id, userId: user.id },
    data: {
      ...(data.description && { description: data.description }),
      ...(data.amount !== undefined && { amount: data.amount }),
      ...(data.date && { date: new Date(data.date) }),
      ...(data.payee && { payee: data.payee }),
      ...(data.type && { type: data.type }),
      ...(data.categoryId !== undefined && { categoryId: data.categoryId || null }),
      ...(data.notes && { notes: data.notes }),
    },
  })

  return NextResponse.json(transaction)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await prisma.transaction.delete({
    where: { id: params.id, userId: user.id },
  })

  return NextResponse.json({ success: true })
}
