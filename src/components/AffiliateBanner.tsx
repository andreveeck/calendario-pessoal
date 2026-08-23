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
