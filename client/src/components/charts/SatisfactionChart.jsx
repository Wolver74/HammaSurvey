import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

function getColor(score) {
  if (score <= 4) return '#EF4444'
  if (score <= 7) return '#F37021'
  return '#22C55E'
}

export default function SatisfactionChart({ data }) {
  return (
    <div className="card">
      <h3 style={{ color: '#003B73', fontWeight: 700, fontSize: '1rem', marginBottom: '1rem', marginTop: 0 }}>
        Distribution des scores de satisfaction (1–10)
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
          <XAxis dataKey="score" tick={{ fontSize: 12, fill: '#374151' }} label={{ value: 'Score', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#6b7280' }} />
          <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
          <Tooltip
            contentStyle={{ borderRadius: '0.5rem', border: '1px solid #e5e7eb', fontSize: '0.85rem' }}
            formatter={(v) => [v, 'Réponses']}
            labelFormatter={(l) => `Score ${l}`}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry) => <Cell key={entry.score} fill={getColor(entry.score)} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '0.5rem', fontSize: '0.75rem' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#EF4444', display: 'inline-block' }} /> 1–4 Insuffisant</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#F37021', display: 'inline-block' }} /> 5–7 Moyen</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#22C55E', display: 'inline-block' }} /> 8–10 Excellent</span>
      </div>
    </div>
  )
}
