import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { yearId: string } }
) {
  const user = await getCurrentUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { status, notes } = await request.json()

  const taxYear = await prisma.taxYear.update({
    where: { id: params.yearId },
    data: { status, notes },
  })

  return NextResponse.json(taxYear)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { yearId: string } }
) {
  const user = await getCurrentUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await prisma.taxYear.delete({
    where: { id: params.yearId },
  })

  return NextResponse.json({ success: true })
}
