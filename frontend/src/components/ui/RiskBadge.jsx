const STYLES = {
  'LOW RISK':  'bg-success-100 text-success-800',
  'HIGH RISK': 'bg-danger-100 text-danger-800',
}

const LABELS = {
  'LOW RISK':  'Risque faible',
  'HIGH RISK': 'Risque élevé',
}

export default function RiskBadge({ verdict }) {
  if (!verdict) return <span className="text-gray-400 text-sm">—</span>

  return (
    <span className={`inline-flex px-3 py-1.5 rounded-full text-sm font-medium ${STYLES[verdict] || 'bg-gray-100 text-gray-600'}`}>
      {LABELS[verdict] || verdict}
    </span>
  )
}
