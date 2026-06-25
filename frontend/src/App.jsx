import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ApplicantForm from './pages/ApplicantForm'
import Confirmation from './pages/Confirmation'
import EmployerLogin from './pages/EmployerLogin'
import Dashboard from './pages/Dashboard'
import ApplicationDetail from './pages/ApplicationDetail'
import StyleGuide from './pages/StyleGuide'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                    element={<ApplicantForm />} />
        <Route path="/confirmation"        element={<Confirmation />} />
        <Route path="/officer/login"       element={<EmployerLogin />} />
        <Route path="/officer/dashboard"   element={<Dashboard />} />
        <Route path="/officer/application/:id" element={<ApplicationDetail />} />
        <Route path="/styleguide" element={<StyleGuide />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App