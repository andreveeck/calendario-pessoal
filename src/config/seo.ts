/**
 * SEO Configuration para WebCal
 * Contém keywords, descrições e metadados otimizados para buscadores
 */

export const SEO_CONFIG = {
  siteName: 'WebCal',
  baseURL: 'https://webcal.app',
  locale: 'pt_BR',
  
  homepage: {
    title: 'WebCal | Calendário Offline - Agenda com Privacidade Total',
    description: 'WebCal: Calendário e agenda online 100% offline com sincronização local. Organize eventos, compromissos e tarefas sem internet. Rápido, privado e sem depender da nuvem.',
    keywords: [
      'calendário',
      'agenda',
      'calendário online',
      'agenda online',
      'planner',
      'organizador pessoal',
      'calendário offline',
      'agenda compartilhada',
      'calendário digital',
      'agenda digital',
      'calendário 2026',
      'calendário 2027',
      'planejador semanal'
    ],
    canonical: 'https://webcal.app'
  },

  // Dados estruturados (Schema.org)
  schema: {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': 'WebCal',
    'description': 'Calendário e agenda com sincronização local. Privado e sem depender da nuvem.',
    'url': 'https://webcal.app',
    'applicationCategory': 'Productivity',
    'operatingSystem': 'All',
    'inLanguage': 'pt-BR',
    'features': [
      'Calendário offline',
      'Sincronização local',
      'Privacidade total',
      'Sem dependência de nuvem',
      'Interface rápida e responsiva',
      'Eventos e compromissos'
    ]
  },

  // Social Media
  social: {
    twitter: '@webcalapp',
    ogType: 'website',
    ogImage: '/og-image.jpg' // Adicionar imagem OG futuramente
  }
};

// Função para gerar meta tags dinâmicas
export function generateMetaTags(page: 'homepage' | 'calendar') {
  const config = SEO_CONFIG[page] || SEO_CONFIG.homepage;
  
  return {
    title: config.title,
    description: config.description,
    keywords: config.keywords.join(', '),
    canonical: config.canonical || SEO_CONFIG.homepage.canonical,
    openGraph: {
      title: config.title,
      description: config.description,
      type: SEO_CONFIG.social.ogType,
      url: config.canonical || SEO_CONFIG.homepage.canonical,
      image: SEO_CONFIG.social.ogImage
    }
  };
}
