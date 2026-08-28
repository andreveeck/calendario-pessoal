# 🗓️ WebCal — Plano de Melhorias

> Documento de análise e plano de evolução do WebCal (calendário offline-first).
> React 19 · Vite · Tailwind 4 · FullCalendar 6 · SQLite (`sql.js`) via IndexedDB · deploy Vercel.

---

## O que é o projeto hoje

Calendário/agenda **offline-first**, em pt-BR, com:

- Criação, edição e exclusão de eventos (arrastar/redimensionar com persistência local)
- Eventos de dia inteiro
- **Recorrência** (rrule: diária, dias úteis, semanal, mensal)
- **Importação ICS** (`ical.js`)
- Backup/restauração em arquivo `.sqlite`
- Busca por texto + filtro por categoria (label)
- Lembretes in-app (som + haptics + banner)
- Página de entrada com SEO + banners de afiliado
- Armazenamento persistente no IndexedDB (SQL real local, sem backend)

**Base sólida** do ponto de vista de dados. Os problemas estão em **bugs de borda**, **escopo de produto** e **arquitetura do arquivo central**.

---

## 1. 🔴 Bugs e riscos de correção (fazer primeiro)

### 1.1 Arrastar/redimensionar evento recorrente não salva
- Em `loadEvents`, cada ocorrência expandida recebe `id = "${id}-r${n}"`.
- Em `handleEventChange`, o drag chama `updateEvent(..., event.id)`, mas esse id expandido **não existe na tabela** → `WHERE id = 'abc-r1'` não casa nada → a mudança some no reload.
- **Correção**: no drag, mapear de volta para `original_event_id`.
- *Além disso*: não há suporte a "editar só esta ocorrência" vs "toda a série".

### 1.2 Manuseio de fuso horário frágil (bugs de DST)
- `toDateTimeInput`/`fromDateTimeInput` fazem ajuste manual de `getTimezoneOffset()` e armazenam ISO-UTC.
- Quebra em março/novembro (horário de verão) e quando o usuário viaja.
- **Correção**: guardar datas **locais sem timezone** (`YYYY-MM-DDTHH:mm`) ou padronizar tudo em UTC com uma camada única de conversão.

### 1.3 `updateEvent` monta o `SET` via template string com as chaves do objeto
- Quando os callers passam chaves conhecidas o risco é baixo, mas o ideal é uma **whitelist** de colunas permitidas.
- Evita injeção/erro se um campo dinâmico for adicionado no futuro.

### 1.4 Importação de backup sobrescreve o banco sem confirmação
- `handleImportDatabase` chama `importDatabase` direto — arquivo errado = perda total.
- **Correção**: diálogo de confirmação ("restaurar substitui os dados atuais").

### 1.5 `README.md` corrompido
- Linhas 19–63 misturam comentários do template ESLint dentro do README (bloco de código aberto, conteúdo embaralhado).
- **Correção**: reescrever.

---

## 2. 🧹 Limpeza de código (dead code confirmado por busca)

| Item | Onde | Situação |
|---|---|---|
| `generateMetaTags` / `SEO_CONFIG` | `src/config/seo.ts` | **Arquivo inteiro é morto** — as meta tags estão hardcoded no `index.html` |
| `buildRecurrenceRule` | `src/utils/recurrenceService.ts` | Exportado, nenhuma chamada |
| `getEventById` | `src/utils/eventService.ts` | Exportado, nenhuma chamada |
| `src/App.css` (184 linhas) | estilo do template Vite (`.counter`, `.hero`) | **Não é importado** — `main.tsx` só importa `index.css` |

> Conciliar o `seo.ts` com o `index.html` é decisão chave: **remover** o arquivo, ou **usá-lo de verdade** (conecta com o item de SEO na Fase 6).

---

## 3. 🏗 Arquitetura — o ponto mais importante

**`CalendarView.tsx` tem ~1157 linhas** e concentra: toolbar, busca/filtro, modal do editor, modal de import ICS, banner de notificação, lógica de lembretes, alerta sonoro, haptics, export/import de banco — tudo em um componente.

**Refatoração sugerida** (um componente/hook por responsabilidade):

- `EventEditorModal.tsx` — o form completo
- `CalendarToolbar.tsx` — botões de import/export/refresh/lembretes
- `IcalImportModal.tsx` — modal de importação ICS
- `ReminderBanner.tsx` — banner de notificação
- `useReminders` hook — polling + grace window
- `useEventsManager` hook — carga, CRUD, recorrência (tira estado do componente)

**Também ganha performance**:
- Hoje `eventRecords.flatMap(expandRecurringEvent)` roda em **todo render**.
- Há **dupla expansão**: `expandedEventRecords` no render **e** `expandedEvents` dentro de `loadEvents`.
- Com `useMemo` + uma única fonte de eventos expandidos, evita recálculo desnecessário.

---

## 4. 🚀 Melhorias de produto (por ordem de valor)

1. **PWA instalável (Service Worker + manifest)** — a maior lacuna. O pitch é "100% offline", mas hoje não dá para **instalar** nem abrir sem rede após a primeira carga. Um SW com cache de recursos cumpre a promessa.
2. **Notificações nativas (Notification API + SW)** — hoje os lembretes só disparam com o app **aberto e em primeiro plano**. Para um calendário offline, o lembrete deveria chegar com a aba **fechada/em segundo plano**.
3. **Lista de tarefas / checklist** — o posicionamento é "agenda/planner", mas não existe lista de afazeres. Complemento natural, viável no mesmo SQLite.
4. **Exportar para `.ics` (e compartilhar 1 evento)** — hoje só **importa** ICS, não exporta. Simetria esperada + botão "adicionar ao Google/Apple".
5. **Editar "esta ocorrência" da série** — permitir exceções em eventos recorrentes (hoje a edição muda a série inteira).
6. **Dark mode** — Tailwind 4 torna barato; concorrentes têm.
7. **Autosave de rascunho no editor** — fechar o modal perde o texto digitado.
8. **Calendários personalizados por cor** — já tem `label`/`color`, falta legenda + checkbox para mostrar/ocultar por categoria.
9. **Estatísticas / revisão da semana** — "N eventos na semana, X concluídos" encaixa no público de produtividade.

---

## 5. 📈 SEO e branding

- **`seo.ts` está desligado** — a meta está hardcoded no `index.html` e **nunca muda ao navegar** (não há roteamento). Para rankear páginas reais, precisa de rotas reais (+ SSR/prerender) ou atualizar o `<title>` por estado.
- **`og:image` não existe** — compartilhar no WhatsApp mostra sem preview (ruim, ainda mais com marketing/afiliado na página).
- **Canonical aponta para `calendario-pessoal-ruby.vercel.app`** — domínio automático da Vercel, ruim para marca e SEO. Reservar domínio próprio (ex.: `webcal.com.br`) e centralizar é barato.
- **Conteúdo estruturado** — para rankear em "calendário 2026", adicionar seção FAQ natural em H2/H3 com as mesmas keywords, além das meta tags.

---

## 6. 💼 Monetização — o ponto mais delicado

Os banners atuais (AliExpress genérico, Loja Colombo) estão **desconexos do produto** — um calendário de produtividade/privacidade mostrando promoções de eletrônicos parece *ad bait* e machuca conversão e E-E-A-T.

- **Anúncios contextuais/relacionados**: planners, cadernos, material de escritório, cursos de produtividade — alinhados ao público.
- **Melhor modelo**: versão **Pro** (tema escuro, calendários múltiplos, notificações nativas, export avançado, sem anúncios) via assinatura/pagamento único **manual** (modelo já usado no PagSeguro). Monetiza melhor que afiliado e reforça a marca.
- **Manter afiliado** só como rodapé discreto e claramente rotulado, não como destaque.

---

## 7. 📋 Eficiência de dados

- **`executeQuery` grava o banco INTEIRO no IndexedDB a cada mutação** (`db.export()` serializa tudo a cada INSERT/UPDATE/DELETE). Caro em calendário com muitas ocorrências recorrentes.
- **Solução**: **debounce** das escritas (ex.: salvar 500 ms após a última mutação) — mantém durabilidade com muito menos I/O.
- O restante do `useSQLite.ts` está bem feito (transações + `oncomplete`); só falta o debounce.

---

## 🎯 Plano de execução (faseado)

| Fase | Ação | Impacto |
|---|---|---|
| **1. Correções** | Bug drag de recorrente; confirmação no import de backup; timezone; whitelist no UPDATE | Parar perda de dados silenciosa |
| **2. Limpeza** | Remover/usar `seo.ts`; apagar `App.css` e dead code; reescrever README | Código mais saudável |
| **3. Refactor** | Quebrar `CalendarView` em componentes + `useMemo` na expansão | Base p/ tudo que vem |
| **4. PWA + Notificações** | Service worker, manifest, notificação nativa | Cumpre a promessa "offline" |
| **5. Produto** | Export ICS, lista de tarefas, dark mode, exceções de recorrência | Diferenciação |
| **6. SEO/Marca** | Domínio próprio, `og:image`, ativar `seo.ts`, FAQ em H2 | Tráfego orgânico |
| **7. Monetização** | Versão Pro manual em vez de afiliado genérico | Receita + marca |

---

### Ordem recomendada para começar
Recomendo iniciar pela **Fase 1 (correções de bugs)** e **Fase 2 (limpeza de dead code)** — baixo risco, melhoram a base de verdade. Em seguida o **PWA + notificações nativas (Fase 4)**, que é o salto de valor mais visível.