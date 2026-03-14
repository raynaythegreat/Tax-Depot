'use client'

import { useEffect, useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts'

interface ChartData {
  month: string
  income: number
  expenses: number
}

export default function DashboardChart({ userId }: { userId: string }) {
  const [data, setData] = useState<ChartData[]>([])

  useEffect(() => {
    fetch(`/api/transactions/chart?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setData(data)
        } else {
          setData([])
        }
      })
      .catch(() => setData([]))
  }, [userId])

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="month"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip 
          formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
          labelStyle={{ color: '#000' }}
        />
        <Legend />
        <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
