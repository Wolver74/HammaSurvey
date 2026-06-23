import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const COLORS = ['#003B73', '#005BAA', '#F37021', '#E8601A', '#22C55E', '#0284c7']

export default function AgeDistributionChart({ data }) {
  return (
    <div className="card">
      <h3 style={{ color: '#003B73', fontWeight: 700, fontSize: '1rem', marginBottom: '1rem', marginTop: 0 }}>
        Distribution par tranche d'âge
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
          <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
          <YAxis dataKey="label" type="category" tick={{ fontSize: 12, fill: '#374151' }} width={55} />
          <Tooltip
            contentStyle={{ borderRadius: '0.5rem', border: '1px solid #e5e7eb', fontSize: '0.85rem' }}
            formatter={(v) => [v, 'Réponses']}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
