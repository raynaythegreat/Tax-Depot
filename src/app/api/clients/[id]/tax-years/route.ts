import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { year } = await request.json()

  const existing = await prisma.taxYear.findUnique({
    where: {
      clientId_year: {
        clientId: params.id,
        year,
      },
    },
  })

  if (existing) {
    return NextResponse.json({ error: 'Tax year already exists' }, { status: 400 })
  }

  const taxYear = await prisma.taxYear.create({
    data: {
      clientId: params.id,
      year,
    },
  })

  return NextResponse.json(taxYear)
}
