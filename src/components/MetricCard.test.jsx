import { render, screen } from '@testing-library/react'
import MetricCard from './MetricCard'

describe('MetricCard en el Dashboard', () => {
  it('muestra la etiqueta, el valor y la nota de una métrica de Consumo', () => {
    render(
      <MetricCard
        label="Consumo actual"
        value="120.5 kWh"
        hint="Fecha de lectura: 07 nov 2026"
      />,
    )

    expect(screen.getByText('Consumo actual')).toBeInTheDocument()
    expect(screen.getByText('120.5 kWh')).toBeInTheDocument()
    expect(screen.getByText('Fecha de lectura: 07 nov 2026')).toBeInTheDocument()
  })

  it('muestra la métrica secundaria con su etiqueta', () => {
    render(
      <MetricCard
        label="Consumo acumulado"
        value="900 kWh"
        secondaryLabel="Promedio"
        secondaryValue="150 kWh"
      />,
    )

    expect(screen.getByText('Consumo acumulado')).toBeInTheDocument()
    expect(screen.getByText('Promedio')).toBeInTheDocument()
    expect(screen.getByText('150 kWh')).toBeInTheDocument()
  })

  it('no renderiza nada cuando los campos opcionales no se envían', () => {
    const { container } = render(<MetricCard label="Consumo anterior" value="98.2 kWh" />)

    expect(container.textContent).toBe('Consumo anterior98.2 kWh')
  })

  it.each(['default', 'accent', 'soft'])(
    'muestra el contenido completo con el tono %s',
    (tone) => {
      render(
        <MetricCard
          label="Consumo actual"
          value="120.5 kWh"
          hint="Fecha de lectura: 07 nov 2026"
          secondaryLabel="Consumo anterior"
          secondaryValue="98.2 kWh"
          tone={tone}
        />,
      )

      expect(screen.getByText('Consumo actual')).toBeInTheDocument()
      expect(screen.getByText('120.5 kWh')).toBeInTheDocument()
      expect(screen.getByText('Fecha de lectura: 07 nov 2026')).toBeInTheDocument()
      expect(screen.getByText('Consumo anterior')).toBeInTheDocument()
      expect(screen.getByText('98.2 kWh')).toBeInTheDocument()
    },
  )
})
