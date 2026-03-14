import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

const defaultCategories = [
  { name: 'Sales Revenue', type: 'income', color: '#10b981' },
  { name: 'Service Income', type: 'income', color: '#059669' },
  { name: 'Other Income', type: 'income', color: '#047857' },
  { name: 'Rent', type: 'expense', color: '#ef4444' },
  { name: 'Utilities', type: 'expense', color: '#f97316' },
  { name: 'Payroll', type: 'expense', color: '#eab308' },
  { name: 'Marketing', type: 'expense', color: '#84cc16' },
  { name: 'Office Supplies', type: 'expense', color: '#22c55e' },
  { name: 'Travel', type: 'expense', color: '#14b8a6' },
  { name: 'Insurance', type: 'expense', color: '#06b6d4' },
  { name: 'Professional Services', type: 'expense', color: '#0ea5e9' },
  { name: 'Software', type: 'expense', color: '#3b82f6' },
  { name: 'Equipment', type: 'expense', color: '#6366f1' },
  { name: 'Banking Fees', type: 'expense', color: '#8b5cf6' },
  { name: 'Taxes', type: 'expense', color: '#a855f7' },
  { name: 'Uncategorized', type: 'expense', color: '#6b7280' },
]

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const existingCategories = await prisma.category.count({
    where: { userId: user.id },
  })

  if (existingCategories > 0) {
    return NextResponse.json({ message: 'Categories already exist' })
  }

  const categories = await prisma.category.createMany({
    data: defaultCategories.map((cat) => ({
      ...cat,
      userId: user.id,
    })),
  })

  return NextResponse.json({ created: categories.count })
}
