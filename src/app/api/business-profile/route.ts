import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let profile = await prisma.businessProfile.findUnique({
      where: { userId: user.id },
    })

    if (!profile) {
      profile = await prisma.businessProfile.create({
        data: {
          userId: user.id,
          businessName: user.businessName || user.name || 'My Business',
        },
      })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error fetching business profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch business profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    const profile = await prisma.businessProfile.upsert({
      where: { userId: user.id },
      update: {
        businessName: data.businessName,
        legalName: data.legalName,
        taxId: data.taxId,
        email: data.email,
        phone: data.phone,
        website: data.website,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country,
        logo: data.logo,
        bankName: data.bankName,
        bankAccount: data.bankAccount,
        bankRouting: data.bankRouting,
        paymentTerms: data.paymentTerms,
        invoicePrefix: data.invoicePrefix,
        invoiceNumber: data.invoiceNumber,
        receiptPrefix: data.receiptPrefix,
        receiptNumber: data.receiptNumber,
        defaultCurrency: data.defaultCurrency,
        notes: data.notes,
      },
      create: {
        userId: user.id,
        businessName: data.businessName || 'My Business',
        legalName: data.legalName,
        taxId: data.taxId,
        email: data.email,
        phone: data.phone,
        website: data.website,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country,
        logo: data.logo,
        bankName: data.bankName,
        bankAccount: data.bankAccount,
        bankRouting: data.bankRouting,
        paymentTerms: data.paymentTerms,
        invoicePrefix: data.invoicePrefix || 'INV',
        invoiceNumber: data.invoiceNumber || 1000,
        receiptPrefix: data.receiptPrefix || 'RCP',
        receiptNumber: data.receiptNumber || 1000,
        defaultCurrency: data.defaultCurrency || 'USD',
        notes: data.notes,
      },
    })

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error updating business profile:', error)
    return NextResponse.json(
      { error: 'Failed to update business profile' },
      { status: 500 }
    )
  }
}
