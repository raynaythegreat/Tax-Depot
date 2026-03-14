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

  const transaction = await prisma.transaction.update({
    where: { id: params.id, userId: user.id },
    data: {
      isReconciled: true,
    },
  })

  return NextResponse.json(transaction)
}
