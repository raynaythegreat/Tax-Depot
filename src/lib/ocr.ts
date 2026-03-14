import Tesseract from 'tesseract.js'
import { ParsedTransaction, OCResult } from '@/types'

export async function processImage(file: File): Promise<OCResult> {
  const result = await Tesseract.recognize(file, 'eng', {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`)
      }
    },
  })

  const text = result.data.text
  const confidence = result.data.confidence
  const transactions = parseTransactions(text)

  return {
    text,
    confidence,
    transactions,
  }
}

function parseTransactions(text: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = []
  const lines = text.split('\n').filter((line) => line.trim())

  if (lines.length === 0) return transactions

  const datePatterns = [
    /(\d{1,2}\/\d{1,2}\/\d{2,4})/,
    /(\d{1,2}-\d{1,2}-\d{2,4})/,
    /(\d{4}-\d{2}-\d{2})/,
    /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})/i,
  ]

  const amountPattern = /(-?\$?\s*[\d,]+\.\d{2})/g

  const incomeKeywords = ['credit', 'deposit', 'income', 'payment received', 'transfer in', 'refund', 'return', 'dividend', 'interest earned', 'cashback', 'rebate']
  const ignoreKeywords = ['balance', 'total', 'subtotal', 'summary', 'beginning', 'ending', 'available', 'opening', 'closing']

  for (const line of lines) {
    const lowerLine = line.toLowerCase()
    
    if (ignoreKeywords.some(kw => lowerLine.includes(kw))) continue

    let dateMatch: RegExpMatchArray | null = null
    for (const pattern of datePatterns) {
      const match = line.match(pattern)
      if (match) {
        dateMatch = match
        break
      }
    }

    const amountMatches = line.match(amountPattern)

    if (dateMatch && amountMatches && amountMatches.length > 0) {
      const dateStr = dateMatch[1]
      const date = parseDate(dateStr)
      
      if (date && !isNaN(date.getTime())) {
        const amountStr = amountMatches[amountMatches.length - 1]
        const amount = Math.abs(parseFloat(amountStr.replace(/[$,\s]/g, '')))
        
        const description = line
          .replace(dateMatch[0], '')
          .replace(amountPattern, '')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 100)

        if (description && amount > 0) {
          const isIncome = incomeKeywords.some(kw => lowerLine.includes(kw))
          const type = isIncome ? 'income' : 'expense'

          const isDuplicate = transactions.some(
            t => Math.abs(t.amount - amount) < 0.01 && 
                t.description.substring(0, 20) === description.substring(0, 20)
          )

          if (!isDuplicate) {
            transactions.push({
              date,
              amount,
              description: description || 'Transaction',
              type,
            })
          }
        }
      }
    }
  }

  return transactions
}

function parseDate(dateStr: string): Date | null {
  const monthMap: Record<string, number> = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, sept: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11,
  }

  const shortMonthMatch = dateStr.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2}),?\s*(\d{4})?$/i)
  if (shortMonthMatch) {
    const month = monthMap[shortMonthMatch[1].toLowerCase()]
    const day = parseInt(shortMonthMatch[2])
    const year = shortMonthMatch[3] ? parseInt(shortMonthMatch[3]) : new Date().getFullYear()
    if (!isNaN(month) && !isNaN(day)) {
      return new Date(year, month, day)
    }
  }

  const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (slashMatch) {
    const month = parseInt(slashMatch[1]) - 1
    const day = parseInt(slashMatch[2])
    let year = parseInt(slashMatch[3])
    if (year < 100) year += year < 50 ? 2000 : 1900
    return new Date(year, month, day)
  }

  const dashMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (dashMatch) {
    return new Date(parseInt(dashMatch[1]), parseInt(dashMatch[2]) - 1, parseInt(dashMatch[3]))
  }

  const dashMatch2 = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/)
  if (dashMatch2) {
    const month = parseInt(dashMatch2[1]) - 1
    const day = parseInt(dashMatch2[2])
    let year = parseInt(dashMatch2[3])
    if (year < 100) year += year < 50 ? 2000 : 1900
    return new Date(year, month, day)
  }

  const parsed = new Date(dateStr)
  return isNaN(parsed.getTime()) ? null : parsed
}
