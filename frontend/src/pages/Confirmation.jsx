import { useLocation, useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

export default function Confirmation() {
  const location = useLocation()
  const navigate = useNavigate()
  const applicationId = location.state?.applicationId

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="max-w-md w-full text-center">

        <div className="flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mx-auto mb-6">
          <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">
          Application submitted successfully
        </h1>
        <p className="text-sm font-normal text-gray-600 leading-relaxed mb-6">
          Thank you — your application has been received. A bank advisor will review your file
          and contact you by email with their decision.
        </p>

        {applicationId && (
          <div className="bg-gray-50 rounded-lg px-4 py-3 mb-6">
            <p className="text-xs text-gray-500">Your reference</p>
            <p className="text-lg font-semibold text-gray-900">#{applicationId}</p>
          </div>
        )}

        <Button className="w-full" onClick={() => navigate('/')}>
          Back to home
        </Button>

      </Card>
    </div>
  )
}
