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

  const client = await prisma.client.findUnique({
    where: { id: params.id, userId: user.id },
    include: {
      taxYears: {
        orderBy: { year: 'desc' },
        include: {
          documents: {
            orderBy: { createdAt: 'desc' },
          },
        },
      },
      _count: {
        select: { documents: true, transactions: true },
      },
    },
  })

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  return NextResponse.json(client)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, email, phone, address, notes } = await request.json()

  const client = await prisma.client.update({
    where: { id: params.id, userId: user.id },
    data: { name, email, phone, address, notes },
  })

  return NextResponse.json(client)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await prisma.client.delete({
    where: { id: params.id, userId: user.id },
  })

  return NextResponse.json({ success: true })
}
