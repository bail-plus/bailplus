import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface MiniChartProps {
  data: Array<{ value: number }>
  color?: string
}

export function MiniChart({ data, color = "hsl(var(--primary))" }: MiniChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke={color} 
          strokeWidth={2}
          dot={false}
          activeDot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}