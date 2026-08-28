import { useState } from 'react'
import CalendarView from './components/CalendarView'
import { DeveloperContact } from './components/AffiliateBanner'

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

const faqItems = [
  {
    question: 'O que é o WebCal?',
    answer:
      'O WebCal é um calendário e agenda online 100% offline. Seus eventos ficam armazenados diretamente no seu navegador, sem precisar de servidor ou conta. É um planner digital privado, rápido e gratuito.',
  },
  {
    question: 'Como funciona o calendário offline?',
    answer:
      'O WebCal usa armazenamento local (IndexedDB) para salvar seus eventos. Tudo acontece no seu dispositivo — sem sincronização na nuvem, sem cadastro. Basta abrir o site e começar a usar.',
  },
  {
    question: 'Posso usar como agenda online compartilhada?',
    answer:
      'O WebCal é focado em uso individual e privado. Para compartilhar eventos com outras pessoas, você pode exportar um arquivo de backup (.sqlite) ou importar/exportar eventos no formato padrão ICS.',
  },
  {
    question: 'O WebCal funciona no celular?',
    answer:
      'Sim! O WebCal é responsivo e funciona bem em qualquer dispositivo — celular, tablet ou computador. Além disso, é uma PWA (Progressive Web App), então você pode instalá-lo na tela inicial como um app.',
  },
  {
    question: 'É seguro usar o WebCal para compromissos pessoais?',
    answer:
      'Sim. O WebCal não envia seus dados para nenhum servidor. Tudo fica salvo no seu navegador. Nenhum terceiro tem acesso às suas informações. É ideal para quem prioriza privacidade e segurança.',
  },
  {
    question: 'Posso importar eventos de outros calendários?',
    answer:
      'Sim! O WebCal suporta importação de arquivos ICS (formato padrão do Google Agenda, Apple Calendar e outros). Você também pode fazer backup e restauração do banco de dados completo.',
  },
  {
    question: 'O que diferencia o WebCal de um calendário tradicional?',
    answer:
      'Diferente do Google Agenda ou Outlook, o WebCal não depende de internet, não coleta dados e não precisa de conta. É um organizador pessoal offline que respeita sua privacidade e funciona mesmo sem conexão.',
  },
  {
    question: 'Quais funcionalidades o WebCal oferece?',
    answer:
      'O WebCal inclui: criação e edição de eventos, arrastar e redimensionar, recorrência (diária, semanal, mensal), busca por texto, filtro por categoria, lembretes in-app, importação ICS, backup/restore, visualização mensal, semanal e diária — tudo em português do Brasil.',
  },
]

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
        WebCal — Calendário e Agenda Online 100% Offline
      </h1>

      <p className="mt-4 max-w-xl text-lg text-slate-500">
        Organize seus eventos, compromissos e lembretes com privacidade total.
        Sem internet, sem cadastro, sem depender da nuvem.
      </p>

      <button
        type="button"
        className="mt-8 rounded-lg bg-blue-600 px-8 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-blue-500"
        onClick={() => setShowCalendar(true)}
      >
        Começar agora — é grátis
      </button>

      {/* Benefícios */}
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

      {/* Seção SEO: Como funciona */}
      <section className="mt-20 w-full max-w-3xl text-left">
        <h2 className="text-2xl font-bold text-slate-900">
          Como funciona o calendário offline do WebCal
        </h2>
        <p className="mt-4 text-base leading-relaxed text-slate-600">
          O WebCal é um <strong>calendário online</strong> que funciona 100% offline.
          Ao abrir o site, todos os seus eventos são salvos diretamente no navegador
          usando armazenamento local. Não é necessário criar conta, fazer login ou
          depender de servidor externo. Seus dados de <strong>agenda</strong> ficam
          seguros no seu dispositivo.
        </p>
        <p className="mt-3 text-base leading-relaxed text-slate-600">
          Com o WebCal, você pode criar eventos, definir <strong>lembretes</strong>,
          repetir compromissos (diariamente, semanalmente ou mensalmente) e
          organizar sua vida com total <strong>privacidade</strong>. A interface é
          responsiva e funciona em qualquer dispositivo — celular, tablet ou computador.
        </p>
      </section>

      {/* Seção SEO: Funcionalidades */}
      <section className="mt-12 w-full max-w-3xl text-left">
        <h2 className="text-2xl font-bold text-slate-900">
          Funcionalidades do planner digital
        </h2>
        <ul className="mt-4 space-y-3 text-base text-slate-600">
          <li className="flex items-start gap-3">
            <span className="mt-1 text-blue-600">✓</span>
            <span>
              <strong>Visualização mensal, semanal e diária</strong> — veja sua agenda como preferir
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 text-blue-600">✓</span>
            <span>
              <strong>Criação por seleção</strong> — clique e arraste para criar eventos rapidamente
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 text-blue-600">✓</span>
            <span>
              <strong>Arrastar e redimensionar</strong> — ajuste horários com um toque
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 text-blue-600">✓</span>
            <span>
              <strong>Recorrência</strong> — repita eventos diariamente, em dias úteis, semanal ou mensalmente
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 text-blue-600">✓</span>
            <span>
              <strong>Lembretes in-app</strong> — aviso sonoro e visual quando o compromisso estiver próximo
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 text-blue-600">✓</span>
            <span>
              <strong>Importação ICS</strong> — importe eventos do Google Agenda, Apple Calendar e outros
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 text-blue-600">✓</span>
            <span>
              <strong>Backup e restauração</strong> — exporte e importe seu banco completo em segundos
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 text-blue-600">✓</span>
            <span>
              <strong>Busca e filtros</strong> — encontre eventos por título, descrição ou categoria
            </span>
          </li>
        </ul>
      </section>

      {/* FAQ */}
      <section className="mt-16 w-full max-w-3xl text-left" aria-label="Perguntas frequentes">
        <h2 className="text-2xl font-bold text-slate-900">
          Perguntas frequentes sobre o WebCal
        </h2>
        <div className="mt-6 space-y-4">
          {faqItems.map((item) => (
            <details
              key={item.question}
              className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <summary className="cursor-pointer text-base font-semibold text-slate-900 marker:text-blue-600">
                {item.question}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <div className="mt-12 w-full max-w-2xl">
        <DeveloperContact />
      </div>
    </div>
  )
}

export default App
