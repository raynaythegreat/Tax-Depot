# Tax Depot

Advanced financial document scanner for businesses. Scan bank statements and receipts to generate comprehensive financial reports including Profit & Loss, Balance Sheet, and Cash Flow statements.

## Features

- **Document Upload**: Drag & drop upload for images (PNG, JPG) and PDFs
- **OCR Processing**: Automatic text extraction using Tesseract.js
- **Transaction Management**: View, categorize, and manage financial transactions
- **Financial Reports**: 
  - Profit & Loss Statement
  - Balance Sheet
  - Cash Flow Statement
- **Dashboard**: Visual overview of your financial health with charts
- **Modern UI**: Clean, responsive interface with dark mode support
- **Local Database**: SQLite database - no server setup required!

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Database**: SQLite, Prisma ORM
- **OCR**: Tesseract.js
- **Charts**: Recharts
- **Auth**: Custom JWT-based authentication

## Quick Start

### Prerequisites

- Node.js 18+ 

### Setup

1. **Open a terminal in the project folder** (Desktop/tax-depot)

2. **Install dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Initialize database**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Start the app**:
   ```bash
   npm run dev
   ```

5. **Open in browser**: http://localhost:3000

### One-Command Setup (if Node.js is installed)

**Windows**:
```cmd
setup.bat
```

**Linux/Mac/WSL**:
```bash
chmod +x setup.sh
./setup.sh
```

## Usage Guide

### 1. Create Account
- Navigate to the app and click "Sign up"
- Enter your name, email, and password
- Optionally add your business name
- Default categories are created automatically

### 2. Upload Documents
- Go to **Documents** page
- Drag & drop bank statements or receipts (PNG, JPG, PDF)
- Click "Upload & Process"
- Wait for OCR processing to complete

### 3. Review Transactions
- Go to **Transactions** page
- Review auto-extracted transactions
- Filter by type (income/expense)
- Search by description

### 4. Generate Reports
- Go to **Reports** page
- Select report type:
  - **Profit & Loss** - Income vs expenses by category
  - **Balance Sheet** - Assets, liabilities, equity
  - **Cash Flow** - Operating, investing, financing activities
- Click "Generate Report"
- Export to CSV if needed

### 5. Dashboard
- View financial overview
- Income vs Expenses chart
- Recent transactions
- Quick stats

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:push` | Push schema changes to database |
| `npm run db:studio` | Open Prisma Studio (database GUI) |

## Project Structure

```
tax-depot/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── (dashboard)/  # Protected dashboard routes
│   │   ├── api/          # API endpoints
│   │   ├── login/        # Login page
│   │   └── signup/       # Signup page
│   ├── components/       # React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── dashboard/    # Dashboard widgets
│   │   └── documents/    # Document components
│   ├── lib/              # Utilities
│   │   ├── auth.ts       # Authentication
│   │   ├── db.ts         # Database client
│   │   ├── ocr.ts        # OCR processing
│   │   └── utils.ts      # Helpers
│   └── types/            # TypeScript types
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── dev.db            # SQLite database file
├── uploads/              # Uploaded documents (created at runtime)
├── setup.bat             # Windows setup script
├── setup.sh              # Linux/Mac setup script
└── start.bat             # Windows start script
```

## Troubleshooting

### npm install fails
- Try: `npm install --legacy-peer-deps`
- Delete `node_modules` and `package-lock.json`, then retry

### Prisma errors
- Run: `npx prisma generate`
- Run: `npx prisma db push`

### Port 3000 in use
- Change port: `npm run dev -- -p 3001`

### Database issues
- Delete `prisma/dev.db` and run `npx prisma db push` to recreate

## License

MIT
