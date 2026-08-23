interface AffiliateBannerProps {
  href: string
  label: string
  description: string
  imageUrl?: string
}

const AFFILIATE_LINKS: AffiliateBannerProps[] = [
  {
    href: 'https://s.click.aliexpress.com/e/_DkX0zL7',
    label: 'AliExpress — As Melhores Ofertas',
    description: 'Encontre gadgets, eletrônicos e utilidades com super descontos e frete grátis!',
    imageUrl: '/banner1webcal.jpg',
  },
  {
    href: 'https://apretailer.com.br/click/663e510e2bfa8149207f7ff2/183323/249927/',
    label: 'Lojas Colombo — Ofertas Incríveis',
    description: 'Eletros, móveis e tecnologia com condições especiais e descontos imperdíveis!',
    imageUrl: '/banner2webcal.jpg',
  },
  {
    href: 'https://apretailer.com.br/click/6a8a657e2bfa81342804fbd3/185640/249927/',
    label: 'Descubra Promoções',
    description: 'Aproveite ofertas exclusivas e promoções imperdíveis para você.',
    imageUrl: '/banner3webcal.png',
  },
]

export function AffiliateBanner({ href, label, description, imageUrl }: AffiliateBannerProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow"
    >
      {imageUrl ? (
        <div className="mb-3 flex aspect-square w-full items-center justify-center overflow-hidden rounded-md border border-slate-100 bg-white p-2">
          <img
            src={imageUrl}
            alt={label}
            className="h-full w-full object-contain"
          />
        </div>
      ) : (
        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-xs font-bold text-blue-600">
          {label.slice(0, 2).toUpperCase()}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{description}</p>
      </div>
      <span className="mt-3 text-xs font-semibold text-blue-600">Ver oferta</span>
    </a>
  )
}

export function DeveloperContact() {
  const whatsappUrl = `https://wa.me/5551991251325?text=${encodeURIComponent(
    'Olá! Gostaria de enviar sugestões ou propostas de negócios para o WebCal.'
  )}`

  return (
    <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600 shadow-sm sm:flex-row">
      <div className="text-center sm:text-left">
        <p className="font-semibold text-slate-800">Tem sugestões ou propostas de negócios?</p>
        <p className="text-slate-500">Entre em contato direto com o desenvolvedor.</p>
      </div>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white shadow-sm transition hover:bg-emerald-500 active:scale-95"
      >
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>
        <span>Falar no WhatsApp</span>
      </a>
    </div>
  )
}

export function AffiliateFooter() {
  return (
    <footer className="mt-8 space-y-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
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

      <DeveloperContact />
    </footer>
  )
}
