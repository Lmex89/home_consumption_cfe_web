import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import RequireAuth from './RequireAuth'
import { setAccessToken } from '../lib/authStorage'

function LoginProbe() {
  const location = useLocation()

  return (
    <>
      <p>Pantalla de inicio de sesión</p>
      <p>{`Desde: ${location.state?.from?.pathname ?? ''}`}</p>
    </>
  )
}

function renderProtectedRoute() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/login" element={<LoginProbe />} />
        <Route
          path="/dashboard"
          element={(
            <RequireAuth>
              <p>Contenido del Hogar</p>
            </RequireAuth>
          )}
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RequireAuth en las rutas protegidas', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('redirige al login cuando no hay sesión', () => {
    renderProtectedRoute()

    expect(screen.getByText('Pantalla de inicio de sesión')).toBeInTheDocument()
    expect(screen.queryByText('Contenido del Hogar')).not.toBeInTheDocument()
  })

  it('muestra el contenido hijo cuando hay sesión', () => {
    setAccessToken('token-de-sesión')

    renderProtectedRoute()

    expect(screen.getByText('Contenido del Hogar')).toBeInTheDocument()
    expect(screen.queryByText('Pantalla de inicio de sesión')).not.toBeInTheDocument()
  })

  it('conserva la ubicación original en el estado de navegación', () => {
    renderProtectedRoute()

    expect(screen.getByText('Desde: /dashboard')).toBeInTheDocument()
  })
})
