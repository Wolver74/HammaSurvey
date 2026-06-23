import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#22C55E', '#e5e7eb']

export default function LifeInsuranceChart({ data }) {
  return (
    <div className="card">
      <h3 style={{ color: '#003B73', fontWeight: 700, fontSize: '1rem', marginBottom: '1rem', marginTop: 0 }}>
        Possession d'une assurance vie
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={95}
            dataKey="count"
            nameKey="label"
            paddingAngle={3}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={i === 0 ? '#22C55E' : '#e5e7eb'} stroke="white" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: '0.5rem', border: '1px solid #e5e7eb', fontSize: '0.85rem' }}
            formatter={(v, name) => [v, name]}
          />
          <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '0.85rem' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
