import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function AnnualPremiumChart({ data }) {
  return (
    <div className="card">
      <h3 style={{ color: '#003B73', fontWeight: 700, fontSize: '1rem', marginBottom: '1rem', marginTop: 0 }}>
        Prime annuelle moyenne par tranche d'âge (DT)
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#374151' }} />
          <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={v => `${v} DT`} />
          <Tooltip
            contentStyle={{ borderRadius: '0.5rem', border: '1px solid #e5e7eb', fontSize: '0.85rem' }}
            formatter={(v) => [`${v.toFixed(0)} DT`, 'Prime moyenne']}
          />
          <Bar dataKey="avg" fill="#003B73" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
