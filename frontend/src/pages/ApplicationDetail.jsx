import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import StatusBadge from '../components/ui/StatusBadge'
import RiskBadge from '../components/ui/RiskBadge'

const PROFESSIONAL_STATUS_LABELS = {
  SALARIE:       'Salaried employee',
  SELF_EMPLOYED: 'Self-employed / Entrepreneur',
  RETIRED:       'Retired',
}

const DOCUMENT_TYPE_LABELS = {
  CIN:                  'National ID card (CIN)',
  BULLETINS:            'Payslips',
  ATTESTATION_TRAVAIL:  'Employment certificate',
  RELEVES_BANCAIRES:    'Bank statements',
  RIB:                  'Bank account details (RIB)',
  PATENTE_RC:           'Business license / Trade register',
  DECLARATION_FISCALE:  'Tax return',
  ATTESTATION_PENSION:  'Pension certificate',
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value ?? '—'}</span>
    </div>
  )
}

function ApplicantInfoCard({ app }) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <p className="text-base font-semibold text-gray-900">Applicant information</p>
        <StatusBadge status={app.status} />
      </div>
      <InfoRow label="Full name" value={app.full_name} />
      <InfoRow label="Email" value={app.email} />
      <InfoRow label="Phone" value={app.phone} />
      <InfoRow label="Age" value={app.age} />
      <InfoRow label="Professional status" value={PROFESSIONAL_STATUS_LABELS[app.professional_status] || app.professional_status} />
      <InfoRow label="Declared monthly income" value={`${app.declared_monthly_income.toLocaleString()} MAD`} />
      <InfoRow label="Number of dependents" value={app.number_of_dependents} />
      <InfoRow label="Real estate loans" value={app.real_estate_loans} />
      <InfoRow label="Loan amount requested" value={`${app.loan_amount.toLocaleString()} MAD`} />
      <InfoRow label="Submitted on" value={new Date(app.created_at).toLocaleDateString('en-GB')} />
    </Card>
  )
}

function DocumentsCard({ documents, token }) {
  const [openingId, setOpeningId] = useState(null)
  const [openError, setOpenError] = useState('')

  async function openDocument(doc) {
    setOpenError('')
    setOpeningId(doc.id)
    try {
      const res = await fetch(`http://127.0.0.1:8000/documents/${doc.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()

      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      window.open(blobUrl, '_blank')
      // Give the new tab time to load the resource before freeing it.
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)
    } catch {
      setOpenError('Unable to open this document.')
    } finally {
      setOpeningId(null)
    }
  }

  return (
    <Card>
      <p className="text-base font-semibold text-gray-900 mb-4">Uploaded documents</p>

      {openError && (
        <div className="bg-danger-50 border border-danger-200 text-danger-700 text-sm rounded-lg px-4 py-3 mb-4">
          {openError}
        </div>
      )}

      {documents.length === 0 ? (
        <p className="text-sm text-gray-400">No documents attached.</p>
      ) : (
        <ul className="space-y-2">
          {documents.map(doc => (
            <li key={doc.id} className="flex items-center justify-between text-sm border-b border-gray-100 last:border-0 py-2">
              <span className="text-gray-700">{DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}</span>
              <button
                onClick={() => openDocument(doc)}
                disabled={openingId === doc.id}
                className="text-primary-600 hover:text-primary-700 hover:underline disabled:opacity-50 disabled:no-underline"
              >
                {openingId === doc.id ? 'Opening...' : doc.original_filename}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function ReviewForm({ fields, onChange, onSubmit, loading, error }) {
  return (
    <Card>
      <p className="text-base font-semibold text-gray-900 mb-1">Financial review</p>
      <p className="text-sm text-gray-500 mb-5">
        Enter the verified financial figures, then run the model to get a risk prediction.
      </p>

      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-700 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <Input
          label="Verified monthly income (MAD) *"
          type="number"
          value={fields.verifiedMonthlyIncome}
          onChange={e => onChange('verifiedMonthlyIncome', e.target.value)}
          placeholder="8000"
          min="0"
        />

        <p className="text-xs text-gray-400">
          The fields below come from the credit bureau report (rapport de solvabilité).
        </p>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Credit line usage (0–1) *"
            type="number"
            value={fields.creditLineUsage}
            onChange={e => onChange('creditLineUsage', e.target.value)}
            placeholder="0.3"
            min="0" max="1" step="0.01"
          />
          <Input
            label="Debt ratio (0–1) *"
            type="number"
            value={fields.debtRatio}
            onChange={e => onChange('debtRatio', e.target.value)}
            placeholder="0.2"
            min="0" step="0.01"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Late payments 30-59 days"
            type="number"
            value={fields.late3059}
            onChange={e => onChange('late3059', e.target.value)}
            min="0"
          />
          <Input
            label="Late payments 60-89 days"
            type="number"
            value={fields.late6089}
            onChange={e => onChange('late6089', e.target.value)}
            min="0"
          />
          <Input
            label="Late 90+ days"
            type="number"
            value={fields.late90}
            onChange={e => onChange('late90', e.target.value)}
            min="0"
          />
        </div>

        <Input
          label="Open credit lines"
          type="number"
          value={fields.openCreditLines}
          onChange={e => onChange('openCreditLines', e.target.value)}
          min="0"
        />

        <Button className="w-full mt-2" onClick={onSubmit} disabled={loading}>
          {loading ? 'Running prediction...' : 'Run prediction'}
        </Button>
      </div>
    </Card>
  )
}

function PredictionCard({ app }) {
  return (
    <Card>
      <p className="text-base font-semibold text-gray-900 mb-4">Prediction result</p>

      <div className="flex items-center gap-4 mb-5">
        <div>
          <p className="text-xs text-gray-400 mb-1">Default probability</p>
          <p className="text-3xl font-bold text-gray-900 tracking-tight">
            {(app.default_probability * 100).toFixed(1)}%
          </p>
        </div>
        <RiskBadge verdict={app.risk_verdict} />
      </div>

      <InfoRow label="Verified monthly income" value={`${app.verified_monthly_income.toLocaleString()} MAD`} />
      <InfoRow label="Loan amount requested" value={`${app.loan_amount.toLocaleString()} MAD`} />
      <InfoRow label="Predicted on" value={app.predicted_at ? new Date(app.predicted_at).toLocaleDateString('en-GB') : '—'} />
    </Card>
  )
}

function DecisionCard({ app, onDecide, loading, error }) {
  return (
    <Card>
      <p className="text-base font-semibold text-gray-900 mb-4">Decision</p>

      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-700 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {app.status === 'PREDICTED' ? (
        <div className="flex gap-3">
          <Button className="flex-1" onClick={() => onDecide('ACCEPTED')} disabled={loading}>
            {loading ? '...' : 'Accept'}
          </Button>
          <Button variant="danger" className="flex-1" onClick={() => onDecide('REFUSED')} disabled={loading}>
            {loading ? '...' : 'Refuse'}
          </Button>
        </div>
      ) : (
        <div>
          <InfoRow label="Final status" value={app.status === 'ACCEPTED' ? 'Accepted' : 'Refused'} />
          <InfoRow label="Email sent" value={app.email_sent ? 'Yes' : 'No'} />
          {app.decided_at && (
            <InfoRow label="Decided on" value={new Date(app.decided_at).toLocaleDateString('en-GB')} />
          )}
        </div>
      )}
    </Card>
  )
}

export default function ApplicationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  const [app, setApp]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [reviewFields, setReviewFields] = useState({
    verifiedMonthlyIncome: '',
    creditLineUsage: '',
    debtRatio: '',
    late3059: '0',
    late6089: '0',
    late90: '0',
    openCreditLines: '0',
  })
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError]     = useState('')

  const [decisionLoading, setDecisionLoading] = useState(false)
  const [decisionError, setDecisionError]     = useState('')

  function updateReviewField(key, value) {
    setReviewFields(prev => ({ ...prev, [key]: value }))
  }

  function fetchApplication() {
    return fetch(`http://127.0.0.1:8000/applications/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 401) { navigate('/officer/login'); return null }
        if (res.status === 404) { setApp(undefined); return null }
        if (!res.ok) throw new Error('Failed to load application.')
        return res.json()
      })
      .then(data => { if (data) setApp(data) })
      .catch(() => setLoadError('Unable to load this application.'))
  }

  useEffect(() => {
    if (!token) { navigate('/officer/login'); return }
    fetchApplication().finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleRunPrediction() {
    const { verifiedMonthlyIncome, creditLineUsage, debtRatio } = reviewFields
    if (!verifiedMonthlyIncome || !creditLineUsage || !debtRatio) {
      setReviewError('Please fill in all required fields.')
      return
    }
    setReviewError('')
    setReviewLoading(true)

    try {
      const res = await fetch(`http://127.0.0.1:8000/applications/${id}/review`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verified_monthly_income: Number(verifiedMonthlyIncome),
          credit_line_usage: Number(creditLineUsage),
          debt_ratio: Number(debtRatio),
          late_30_59: Number(reviewFields.late3059 || 0),
          late_60_89: Number(reviewFields.late6089 || 0),
          late_90: Number(reviewFields.late90 || 0),
          open_credit_lines: Number(reviewFields.openCreditLines || 0),
        }),
      })

      const data = await res.json()
      if (res.ok) {
        await fetchApplication()
      } else {
        setReviewError(data.detail || 'Failed to run prediction.')
      }
    } catch {
      setReviewError('Network error. Please check that the server is running.')
    } finally {
      setReviewLoading(false)
    }
  }

  async function handleDecision(decision) {
    setDecisionError('')
    setDecisionLoading(true)

    try {
      const res = await fetch(`http://127.0.0.1:8000/applications/${id}/decision`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ decision }),
      })

      const data = await res.json()
      if (res.ok) {
        await fetchApplication()
      } else {
        setDecisionError(data.detail || 'Failed to record decision.')
      }
    } catch {
      setDecisionError('Network error. Please check that the server is running.')
    } finally {
      setDecisionLoading(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">Loading...</div>
  }
  if (loadError) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-danger-600">{loadError}</div>
  }
  if (!app) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-danger-600">Application not found.</div>
  }

  const hasPrediction = app.default_probability != null

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center gap-4">
        <button onClick={() => navigate('/officer/dashboard')} className="text-gray-400 hover:text-gray-600 transition-colors text-sm">
          ← Back
        </button>
        <h1 className="text-xl font-bold text-gray-900">Application #{app.id}</h1>
      </div>

      <div className="px-8 py-8 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">

        <ApplicantInfoCard app={app} />
        <DocumentsCard documents={app.documents} token={token} />

        {app.status === 'SUBMITTED' && (
          <div className="md:col-span-2">
            <ReviewForm
              fields={reviewFields}
              onChange={updateReviewField}
              onSubmit={handleRunPrediction}
              loading={reviewLoading}
              error={reviewError}
            />
          </div>
        )}

        {hasPrediction && <PredictionCard app={app} />}
        {hasPrediction && (
          <DecisionCard
            app={app}
            onDecide={handleDecision}
            loading={decisionLoading}
            error={decisionError}
          />
        )}

      </div>
    </div>
  )
}
