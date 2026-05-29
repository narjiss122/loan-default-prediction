import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ApplicantForm from './pages/ApplicantForm'
import Confirmation from './pages/Confirmation'
import EmployerLogin from './pages/EmployererLogin'
import Dashboard from './pages/Dashboard'
import ApplicationDetail from './pages/ApplicationDetail'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                    element={<ApplicantForm />} />
        <Route path="/confirmation"        element={<Confirmation />} />
        <Route path="/officer/login"       element={<EmployererLogin />} />
        <Route path="/officer/dashboard"   element={<Dashboard />} />
        <Route path="/officer/application/:id" element={<ApplicationDetail />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App