import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import StatusBadge from '../components/ui/StatusBadge'
import RiskBadge from '../components/ui/RiskBadge'

const PROFESSIONAL_STATUS_LABELS = {
  SALARIE:       'Salaried employee',
  SELF_EMPLOYED: 'Self-employed / Entrepreneur',
  RETIRED:       'Retired',
}

const TABS = [
  { key: 'ALL',       label: 'All' },
  { key: 'SUBMITTED', label: 'Awaiting review' },
  { key: 'PREDICTED', label: 'Awaiting decision' },
  { key: 'DECIDED',   label: 'Decided' },
]

function matchesTab(app, tabKey) {
  if (tabKey === 'ALL') return true
  if (tabKey === 'DECIDED') return app.status === 'ACCEPTED' || app.status === 'REFUSED'
  return app.status === tabKey
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [applications, setApplications] = useState([])
  const [loading, setLoading]            = useState(true)
  const [error, setError]                = useState('')
  const [activeTab, setActiveTab]        = useState('SUBMITTED')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { navigate('/officer/login'); return }

    fetch('http://127.0.0.1:8000/applications', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 401) { navigate('/officer/login'); return null }
        if (!res.ok) throw new Error('Failed to load applications.')
        return res.json()
      })
      .then(data => { if (data) setApplications(data) })
      .catch(() => setError('Unable to load applications.'))
      .finally(() => setLoading(false))
  }, [navigate])

  const counts = TABS.reduce((acc, tab) => {
    acc[tab.key] = applications.filter(app => matchesTab(app, tab.key)).length
    return acc
  }, {})

  const filtered = applications.filter(app => matchesTab(app, activeTab))

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Loan Applications Dashboard</h1>
        <button
          onClick={() => { localStorage.removeItem('token'); navigate('/officer/login') }}
          className="text-sm text-gray-500 hover:text-danger-600 transition-colors"
        >
          Log out
        </button>
      </div>

      <div className="px-8 py-8 max-w-6xl mx-auto">

        {/* Status filter tabs */}
        <div className="flex gap-2 mb-6">
          {TABS.map(tab => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2
                  ${isActive
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}
              >
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full
                  ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {counts[tab.key] ?? 0}
                </span>
              </button>
            )
          })}
        </div>

        {loading && <p className="text-sm text-gray-500">Loading...</p>}
        {error && (
          <div className="bg-danger-50 border border-danger-200 text-danger-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <p className="text-sm text-gray-500 mb-4">{filtered.length} application(s)</p>

            {filtered.length === 0 ? (
              <Card className="text-center py-16">
                <p className="text-gray-400">No applications in this category.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {filtered.map(app => (
                  <Card
                    key={app.id}
                    onClick={() => navigate(`/officer/application/${app.id}`)}
                    className="cursor-pointer hover:border-primary-300 transition-colors flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-[220px]">
                      <p className="text-base font-semibold text-gray-900">
                        #{app.id} — {app.full_name}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">{app.email}</p>
                    </div>

                    <div className="text-sm text-gray-600 min-w-[160px]">
                      <p className="text-xs text-gray-400">Professional status</p>
                      <p>{PROFESSIONAL_STATUS_LABELS[app.professional_status] || app.professional_status}</p>
                    </div>

                    <div className="text-sm text-gray-600 min-w-[140px]">
                      <p className="text-xs text-gray-400">Loan amount</p>
                      <p>{app.loan_amount.toLocaleString()} MAD</p>
                    </div>

                    <div className="text-sm text-gray-600 min-w-[160px]">
                      <p className="text-xs text-gray-400">Declared income</p>
                      <p>{app.declared_monthly_income.toLocaleString()} MAD</p>
                    </div>

                    <div className="text-sm text-gray-500 min-w-[110px]">
                      <p className="text-xs text-gray-400">Submitted</p>
                      <p>{new Date(app.created_at).toLocaleDateString('en-GB')}</p>
                    </div>

                    <div className="min-w-[140px]">
                      <p className="text-xs text-gray-400 mb-1">Risk</p>
                      <div className="flex items-center gap-2">
                        <RiskBadge verdict={app.risk_verdict} />
                        {app.default_probability != null && (
                          <span className="text-xs text-gray-400">
                            {(app.default_probability * 100).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="min-w-[120px]">
                      <p className="text-xs text-gray-400 mb-1">Status</p>
                      <StatusBadge status={app.status} />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
