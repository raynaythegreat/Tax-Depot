import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const user = await getCurrentUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clients = await prisma.client.findMany({
    where: { userId: user.id },
    include: {
      taxYears: {
        select: { id: true, year: true, status: true },
        orderBy: { year: 'desc' },
      },
      _count: {
        select: { documents: true, transactions: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(clients)
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, email, phone, address, notes } = await request.json()

  const client = await prisma.client.create({
    data: {
      userId: user.id,
      name,
      email,
      phone,
      address,
      notes,
    },
  })

  const currentYear = new Date().getFullYear()
  await prisma.taxYear.create({
    data: {
      clientId: client.id,
      year: currentYear,
    },
  })

  return NextResponse.json(client)
}
