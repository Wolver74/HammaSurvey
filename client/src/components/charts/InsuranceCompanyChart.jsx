import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#003B73', '#005BAA', '#F37021', '#E8601A', '#22C55E', '#0284c7', '#7c3aed', '#db2777']

export default function InsuranceCompanyChart({ data }) {
  return (
    <div className="card">
      <h3 style={{ color: '#003B73', fontWeight: 700, fontSize: '1rem', marginBottom: '1rem', marginTop: 0 }}>
        Répartition par compagnie d'assurance
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            outerRadius={90}
            dataKey="count"
            nameKey="label"
            label={({ label, percent }) => percent > 0.05 ? `${label} (${(percent * 100).toFixed(0)}%)` : ''}
            labelLine={false}
          >
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: '0.5rem', border: '1px solid #e5e7eb', fontSize: '0.85rem' }}
            formatter={(v, name) => [v, name]}
          />
          <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '0.8rem' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
