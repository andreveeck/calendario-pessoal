# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
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
  - Backup e restauração do banco SQLite
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

  Os dados são mantidos no IndexedDB do navegador. Para transferir ou preservar os eventos, use `Exportar backup` e guarde o arquivo `.sqlite`. Em outro navegador ou perfil, use `Importar backup` para restaurá-lo.

  O módulo WebAssembly do `sql.js` é empacotado em `public/sql-wasm.wasm`, portanto a aplicação não depende de um domínio externo para inicializar o banco. Os dados dos eventos permanecem locais no navegador.
      reactDom.configs.recommended,
