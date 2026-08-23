import { useState } from 'react'
import CalendarView from './components/CalendarView'

const chips = ['Offline', 'Privado', 'Rápido', 'Local'] as const

const benefits = [
  {
    title: 'Funciona Sem Internet',
    description: 'Acesse e gerencie seus eventos mesmo offline. Tudo sincronizado localmente.',
  },
  {
    title: 'Seus Dados São Privados',
    description: 'Nenhuma informação sai do seu dispositivo. Você tem controle total.',
  },
  {
    title: 'Rápido e Responsivo',
    description: 'Interface fluida que carrega instantaneamente, sem depender de servidores.',
  },
] as const

function App() {
  const [showCalendar, setShowCalendar] = useState(false)

  if (showCalendar) {
    return <CalendarView />
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex flex-wrap justify-center gap-2">
        {chips.map((chip) => (
          <span
            key={chip}
            className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-600 shadow-sm"
          >
            {chip}
          </span>
        ))}
      </div>

      <h1 className="mt-6 text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
        WebCal — Seu calendário privado, rápido e sem internet
      </h1>

      <p className="mt-4 max-w-xl text-lg text-slate-500">
        Organize seus eventos offline, com privacidade total e sem depender da nuvem.
      </p>

      <button
        type="button"
        className="mt-8 rounded-lg bg-blue-600 px-8 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-blue-500"
        onClick={() => setShowCalendar(true)}
      >
        Começar agora
      </button>

      <div className="mt-16 grid gap-6 sm:grid-cols-3">
        {benefits.map((benefit) => (
          <div
            key={benefit.title}
            className="rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm"
          >
            <h3 className="text-base font-semibold text-slate-900">{benefit.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">{benefit.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
