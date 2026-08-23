interface AffiliateBannerProps {
  href: string
  label: string
  description: string
}

const AFFILIATE_LINKS: AffiliateBannerProps[] = [
  {
    href: 'https://affiliate-link.example.com/notion',
    label: 'Notion',
    description: 'Organize notas e projetos junto com seu calendário.',
  },
  {
    href: 'https://affiliate-link.example.com/todoist',
    label: 'Todoist',
    description: 'Gerencie tarefas diárias de forma simples e rápida.',
  },
  {
    href: 'https://affiliate-link.example.com/forest',
    label: 'Forest',
    description: 'Mantenha o foco e evite distrações durante seus compromissos.',
  },
]

export function AffiliateBanner({ href, label, description }: AffiliateBannerProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-50 text-xs font-bold text-blue-600">
        {label.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{description}</p>
      </div>
      <span className="mt-0.5 shrink-0 text-xs text-blue-600">Abrir</span>
    </a>
  )
}

export function AffiliateFooter() {
  return (
    <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Recomendações úteis
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {AFFILIATE_LINKS.map((link) => (
          <AffiliateBanner key={link.label} {...link} />
        ))}
      </div>
      <p className="mt-3 text-[10px] text-slate-400">
        Links de afiliado. Você não paga a mais por isso, e ajuda a manter o projeto.
      </p>
    </div>
  )
}
