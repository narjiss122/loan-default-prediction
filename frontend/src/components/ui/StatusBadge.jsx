const STYLES = {
  SUBMITTED: 'bg-warning-100 text-warning-800',
  PREDICTED: 'bg-blue-100 text-blue-700',
  ACCEPTED:  'bg-success-100 text-success-800',
  REFUSED:   'bg-danger-100 text-danger-800',
}

const LABELS = {
  SUBMITTED: 'Soumis',
  PREDICTED: 'Évalué',
  ACCEPTED:  'Accepté',
  REFUSED:   'Refusé',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex px-3 py-1.5 rounded-full text-sm font-medium ${STYLES[status] || 'bg-gray-100 text-gray-600'}`}>
      {LABELS[status] || status}
    </span>
  )
}
