import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'

const STEPS = ['Personal information', 'Documents', 'Summary']

// Structural email check: local-part@domain.tld, no spaces.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Moroccan mobile numbers: 06/07 + 8 digits (10 digits total),
// or the +212 6/7 + 8 digits international form.
const MOROCCAN_PHONE_REGEX = /^(0[67]\d{8}|\+212[67]\d{8})$/

function isValidEmail(value) {
  return EMAIL_REGEX.test(value.trim())
}

function isValidMoroccanPhone(value) {
  return MOROCCAN_PHONE_REGEX.test(value.trim().replace(/\s+/g, ''))
}

const PROFESSIONAL_STATUS_OPTIONS = [
  { value: 'SALARIE',       label: 'Salaried employee' },
  { value: 'SELF_EMPLOYED', label: 'Self-employed / Entrepreneur' },
  { value: 'RETIRED',       label: 'Retired' },
]

const PROFESSIONAL_STATUS_LABELS = Object.fromEntries(
  PROFESSIONAL_STATUS_OPTIONS.map(o => [o.value, o.label])
)

// The document slots shown in Step 2 depend entirely on this table, keyed by
// professional_status from Step 1. Each entry's `type` is the exact
// DocumentType enum value the backend expects.
const DOCUMENT_SLOTS = {
  SALARIE: [
    { type: 'CIN',                 label: 'National ID card (CIN)' },
    { type: 'BULLETINS',           label: 'Payslips (last 3 months)' },
    { type: 'ATTESTATION_TRAVAIL', label: 'Employment certificate' },
    { type: 'RELEVES_BANCAIRES',   label: 'Bank statements' },
    { type: 'RIB',                 label: 'Bank account details (RIB)' },
  ],
  SELF_EMPLOYED: [
    { type: 'CIN',                  label: 'National ID card (CIN)' },
    { type: 'PATENTE_RC',           label: 'Business license / Trade register' },
    { type: 'DECLARATION_FISCALE',  label: 'Tax return' },
    { type: 'RELEVES_BANCAIRES',    label: 'Bank statements' },
    { type: 'RIB',                  label: 'Bank account details (RIB)' },
  ],
  RETIRED: [
    { type: 'CIN',                  label: 'National ID card (CIN)' },
    { type: 'ATTESTATION_PENSION',  label: 'Pension certificate' },
    { type: 'RELEVES_BANCAIRES',    label: 'Bank statements' },
    { type: 'RIB',                  label: 'Bank account details (RIB)' },
  ],
}

function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center justify-center mb-10 gap-2">
      {STEPS.map((label, i) => {
        const stepNum = i + 1
        const isActive    = stepNum === currentStep
        const isCompleted = stepNum < currentStep
        return (
          <div key={stepNum} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${isCompleted || isActive ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {isCompleted ? '✓' : stepNum}
              </div>
              <span className={`text-sm hidden md:block ${isActive ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {stepNum < STEPS.length && <div className="w-8 h-px bg-gray-200 mx-1" />}
          </div>
        )
      })}
    </div>
  )
}

function FileSlot({ type, label, file, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className={`border-2 border-dashed rounded-lg px-4 py-4 text-center transition-colors
        ${file ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-primary-400'}`}>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          id={`doc-${type}`}
          onChange={e => onChange(type, e.target.files[0] || null)}
        />
        <label htmlFor={`doc-${type}`} className="cursor-pointer">
          {file
            ? <span className="text-primary-700 text-sm font-medium">✓ {file.name}</span>
            : <span className="text-gray-400 text-sm">Click to choose a file (PDF, JPG, PNG)</span>
          }
        </label>
      </div>
    </div>
  )
}

export default function ApplicantForm() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  // Step 1 — personal / declared info
  const [fullName, setFullName]                       = useState('')
  const [email, setEmail]                              = useState('')
  const [phone, setPhone]                               = useState('')
  const [age, setAge]                                   = useState('')
  const [professionalStatus, setProfessionalStatus]     = useState('SALARIE')
  const [declaredMonthlyIncome, setDeclaredMonthlyIncome] = useState('')
  const [numberOfDependents, setNumberOfDependents]     = useState('0')
  const [realEstateLoans, setRealEstateLoans]           = useState('0')
  const [loanAmount, setLoanAmount]                     = useState('')

  // Step 2 — documents, keyed by DocumentType value
  const [documentFiles, setDocumentFiles] = useState({})

  // Format errors for email/phone, shown inline on the Input components
  const [fieldErrors, setFieldErrors] = useState({ email: '', phone: '' })

  const slots = DOCUMENT_SLOTS[professionalStatus]

  function setDocumentFile(type, file) {
    setDocumentFiles(prev => ({ ...prev, [type]: file }))
  }

  function validateEmailField() {
    if (!email.trim()) return
    setFieldErrors(prev => ({
      ...prev,
      email: isValidEmail(email) ? '' : 'Please enter a valid email address',
    }))
  }

  function validatePhoneField() {
    if (!phone.trim()) return
    setFieldErrors(prev => ({
      ...prev,
      phone: isValidMoroccanPhone(phone) ? '' : 'Please enter a valid Moroccan phone number',
    }))
  }

  function validateStep1() {
    if (!fullName.trim() || !email.trim() || !phone.trim() || !age || !declaredMonthlyIncome || !loanAmount) {
      setError('Please fill in all required fields.')
      return false
    }

    const newFieldErrors = {
      email: isValidEmail(email) ? '' : 'Please enter a valid email address',
      phone: isValidMoroccanPhone(phone) ? '' : 'Please enter a valid Moroccan phone number',
    }
    setFieldErrors(newFieldErrors)

    if (newFieldErrors.email || newFieldErrors.phone) {
      setError('Please fix the errors below.')
      return false
    }

    setError('')
    return true
  }

  function validateStep2() {
    const missing = slots.filter(slot => !documentFiles[slot.type])
    if (missing.length > 0) {
      setError('Please attach all required documents.')
      return false
    }
    setError('')
    return true
  }

  async function handleSubmit() {
    if (!validateStep2()) return
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('full_name', fullName.trim())
      formData.append('email', email.trim())
      formData.append('phone', phone.trim())
      formData.append('age', age)
      formData.append('professional_status', professionalStatus)
      formData.append('declared_monthly_income', declaredMonthlyIncome)
      formData.append('number_of_dependents', numberOfDependents || '0')
      formData.append('real_estate_loans', realEstateLoans || '0')
      formData.append('loan_amount', loanAmount)

      // documents[] and document_types[] must stay parallel — built from the
      // same `slots` list, in the same order, so index i always matches.
      slots.forEach(slot => {
        formData.append('documents', documentFiles[slot.type])
        formData.append('document_types', slot.type)
      })

      const res = await fetch('http://127.0.0.1:8000/apply', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (res.ok) {
        navigate('/confirmation', { state: { applicationId: data.application_id } })
      } else {
        setError(data.detail || 'Submission failed.')
      }
    } catch {
      setError('Network error. Please check that the server is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Credit Application</h1>
          <p className="text-sm text-gray-500 mt-2">Fill in the form to submit your application</p>
        </div>

        <StepIndicator currentStep={currentStep} />

        <Card>

          {error && (
            <div className="bg-danger-50 border border-danger-200 text-danger-700 text-sm rounded-lg px-4 py-3 mb-6">
              {error}
            </div>
          )}

          {/* ── STEP 1 — Personal information ── */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Personal information</h2>

              <Input
                label="Full name *"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="e.g. Karim Benali"
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Email *"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onBlur={validateEmailField}
                  error={fieldErrors.email}
                  placeholder="your@email.com"
                />
                <Input
                  label="Phone *"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  onBlur={validatePhoneField}
                  error={fieldErrors.phone}
                  placeholder="06XXXXXXXX"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Age *"
                  type="number"
                  value={age}
                  onChange={e => setAge(e.target.value)}
                  placeholder="35"
                  min="18"
                  max="100"
                />
                <Select
                  label="Professional status *"
                  value={professionalStatus}
                  onChange={e => setProfessionalStatus(e.target.value)}
                  options={PROFESSIONAL_STATUS_OPTIONS}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Declared monthly income (MAD) *"
                  type="number"
                  value={declaredMonthlyIncome}
                  onChange={e => setDeclaredMonthlyIncome(e.target.value)}
                  placeholder="8000"
                  min="0"
                />
                <Input
                  label="Requested loan amount (MAD) *"
                  type="number"
                  value={loanAmount}
                  onChange={e => setLoanAmount(e.target.value)}
                  placeholder="50000"
                  min="0"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Number of dependents"
                  type="number"
                  value={numberOfDependents}
                  onChange={e => setNumberOfDependents(e.target.value)}
                  min="0"
                />
                <Input
                  label="Current real estate loans"
                  type="number"
                  value={realEstateLoans}
                  onChange={e => setRealEstateLoans(e.target.value)}
                  min="0"
                />
              </div>

              <Button
                className="w-full mt-4"
                onClick={() => validateStep1() && setCurrentStep(2)}
              >
                Next →
              </Button>
            </div>
          )}

          {/* ── STEP 2 — Documents (conditional on professional_status) ── */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-gray-800 mb-1">Required documents</h2>
              <p className="text-sm text-gray-500 mb-4">
                Documents required for status: <span className="font-medium text-gray-700">{PROFESSIONAL_STATUS_LABELS[professionalStatus]}</span>
              </p>

              {slots.map(slot => (
                <FileSlot
                  key={slot.type}
                  type={slot.type}
                  label={slot.label}
                  file={documentFiles[slot.type]}
                  onChange={setDocumentFile}
                />
              ))}

              <div className="flex gap-3 mt-4">
                <Button variant="secondary" className="flex-1" onClick={() => { setError(''); setCurrentStep(1) }}>
                  ← Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => validateStep2() && setCurrentStep(3)}
                >
                  Next →
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 3 — Summary & submission ── */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Summary</h2>

              <div className="space-y-3">
                <div>
                  <p className="text-base font-semibold text-gray-900 mb-2">Personal information</p>
                  <dl className="grid grid-cols-2 gap-y-2 text-sm">
                    <dt className="text-gray-500">Full name</dt>
                    <dd className="text-gray-800">{fullName}</dd>
                    <dt className="text-gray-500">Email</dt>
                    <dd className="text-gray-800">{email}</dd>
                    <dt className="text-gray-500">Phone</dt>
                    <dd className="text-gray-800">{phone}</dd>
                    <dt className="text-gray-500">Age</dt>
                    <dd className="text-gray-800">{age}</dd>
                    <dt className="text-gray-500">Professional status</dt>
                    <dd className="text-gray-800">{PROFESSIONAL_STATUS_LABELS[professionalStatus]}</dd>
                    <dt className="text-gray-500">Declared monthly income</dt>
                    <dd className="text-gray-800">{declaredMonthlyIncome} MAD</dd>
                    <dt className="text-gray-500">Loan amount</dt>
                    <dd className="text-gray-800">{loanAmount} MAD</dd>
                    <dt className="text-gray-500">Dependents</dt>
                    <dd className="text-gray-800">{numberOfDependents}</dd>
                    <dt className="text-gray-500">Real estate loans</dt>
                    <dd className="text-gray-800">{realEstateLoans}</dd>
                  </dl>
                </div>

                <div className="pt-2">
                  <p className="text-base font-semibold text-gray-900 mb-2">Attached documents</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {slots.map(slot => (
                      <li key={slot.type} className="flex items-center gap-2">
                        <span className="text-primary-600">✓</span>
                        <span>{slot.label} — {documentFiles[slot.type]?.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="secondary" className="flex-1" onClick={() => { setError(''); setCurrentStep(2) }}>
                  ← Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit application'}
                </Button>
              </div>
            </div>
          )}

        </Card>
      </div>
    </div>
  )
}
