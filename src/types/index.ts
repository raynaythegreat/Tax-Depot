import { Document, Transaction, Account, Category, User } from '@prisma/client'

export type { Document, Transaction, Account, Category, User }

export interface BusinessProfile {
  id: string
  userId: string
  businessName: string
  legalName?: string | null
  taxId?: string | null
  email?: string | null
  phone?: string | null
  website?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  country?: string | null
  logo?: string | null
  bankName?: string | null
  bankAccount?: string | null
  bankRouting?: string | null
  paymentTerms?: string | null
  invoicePrefix: string
  invoiceNumber: number
  receiptPrefix: string
  receiptNumber: number
  defaultCurrency: string
  notes?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface InvoiceItem {
  id: string
  invoiceId: string
  description: string
  quantity: number
  unitPrice: number
  total: number
  sortOrder: number
}

export interface Invoice {
  id: string
  userId: string
  clientId?: string | null
  businessProfileId: string
  invoiceNumber: string
  type: 'invoice' | 'receipt'
  status: 'draft' | 'sent' | 'paid' | 'cancelled'
  issueDate: Date
  dueDate?: Date | null
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  currency: string
  notes?: string | null
  terms?: string | null
  paidAt?: Date | null
  createdAt: Date
  updatedAt: Date
  client?: {
    id: string
    name: string
    email?: string | null
    phone?: string | null
    address?: string | null
  } | null
  items: InvoiceItem[]
  businessProfile: BusinessProfile
}

export interface DashboardStats {
  totalIncome: number
  totalExpenses: number
  netProfit: number
  transactionCount: number
  documentCount: number
  accountCount: number
}

export interface MonthlyData {
  month: string
  income: number
  expenses: number
  profit: number
}

export interface CategoryBreakdown {
  category: string
  amount: number
  percentage: number
  color: string
}

export interface PAndLReport {
  revenue: {
    category: string
    amount: number
  }[]
  totalRevenue: number
  
  expenses: {
    category: string
    amount: number
  }[]
  totalExpenses: number
  
  netProfit: number
  period: {
    start: Date
    end: Date
  }
}

export interface BalanceSheetReport {
  assets: {
    category: string
    amount: number
  }[]
  totalAssets: number
  
  liabilities: {
    category: string
    amount: number
  }[]
  totalLiabilities: number
  
  equity: {
    category: string
    amount: number
  }[]
  totalEquity: number
  
  asOf: Date
}

export interface CashFlowReport {
  operatingActivities: {
    description: string
    amount: number
  }[]
  totalOperating: number
  
  investingActivities: {
    description: string
    amount: number
  }[]
  totalInvesting: number
  
  financingActivities: {
    description: string
    amount: number
  }[]
  totalFinancing: number
  
  netCashFlow: number
  period: {
    start: Date
    end: Date
  }
}

export interface ParsedTransaction {
  date: Date
  amount: number
  description: string
  type: 'income' | 'expense'
  payee?: string
  reference?: string
}

export interface OCResult {
  text: string
  confidence: number
  transactions: ParsedTransaction[]
}
