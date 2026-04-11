import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import RequireAuth from './components/RequireAuth'
import DashboardPage from './pages/DashboardPage'
import InsertarConsumoPage from './pages/InsertarConsumoPage'
import AddHouseholdPage from './pages/AddHouseholdPage'
import AddTariffPage from './pages/AddTariffPage'
import AddBillingPeriodPage from './pages/AddBillingPeriodPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        element={(
          <RequireAuth>
            <Layout />
          </RequireAuth>
        )}
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/insertar-consumo" element={<InsertarConsumoPage />} />
        <Route path="/agregar-vivienda" element={<AddHouseholdPage />} />
        <Route path="/agregar-tarifa" element={<AddTariffPage />} />
        <Route path="/agregar-periodo" element={<AddBillingPeriodPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
