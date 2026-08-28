# WebCal

Calendário offline construído com React, TypeScript, Vite, FullCalendar e SQLite via `sql.js`.

## Funcionalidades

- Visualização mensal, semanal e diária
- Interface em português do Brasil
- Criação de eventos por seleção de período
- Edição de título, descrição, local, cor, datas e horários
- Eventos de dia inteiro
- Exclusão de eventos
- Arrastar e redimensionar com persistência local
- Recorrência (rrule: diária, dias úteis, semanal, mensal)
- Importação de calendário ICS
- Backup e restauração do banco SQLite
- Busca por texto e filtro por categoria
- Lembretes in-app (som + haptics + banner)
- Armazenamento persistente no IndexedDB
- Layout adaptado para telas pequenas

## Desenvolvimento

Requisitos: Node.js 20 ou superior e npm.

```bash
npm install
npm run dev
```

O servidor de desenvolvimento fica disponível em `http://127.0.0.1:5173/`.

## Scripts

```bash
npm run dev      # Inicia o Vite com recarregamento automático
npm run lint     # Executa o ESLint
npm run build    # Gera a build de produção
npm run check    # Executa lint e build como gate de publicação
npm run preview  # Serve a build localmente
```

## Dados locais

Os dados são mantidos no IndexedDB do navegador. Para transferir ou preservar os eventos, use **Exportar backup** e guarde o arquivo `.sqlite`. Em outro navegador ou perfil, use **Importar backup** para restaurá-lo.

O módulo WebAssembly do `sql.js` é empacotado em `public/sql-wasm.wasm`, portanto a aplicação não depende de um domínio externo para inicializar o banco. Os dados dos eventos permanecem locais no navegador.
