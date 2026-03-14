import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get('status')
  const clientId = searchParams.get('clientId')
  const year = searchParams.get('year')

  const where: any = { userId: user.id }

  if (status && status !== 'all') {
    where.status = status
  }

  if (clientId) {
    where.clientId = clientId
  }

  if (year) {
    where.taxYear = { year: parseInt(year) }
  }

  const documents = await prisma.document.findMany({
    where,
    include: {
      client: { select: { id: true, name: true } },
      taxYear: { select: { id: true, year: true } },
      transactions: {
        include: {
          category: { select: { id: true, name: true, color: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(documents)
}
