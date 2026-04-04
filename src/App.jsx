import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import InsertarConsumoPage from './pages/InsertarConsumoPage'
import AddHouseholdPage from './pages/AddHouseholdPage'
import AddTariffPage from './pages/AddTariffPage'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/insertar-consumo" element={<InsertarConsumoPage />} />
        <Route path="/agregar-vivienda" element={<AddHouseholdPage />} />
        <Route path="/agregar-tarifa" element={<AddTariffPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
