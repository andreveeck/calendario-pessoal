import type { Database } from 'sql.js'

interface CalendarToolbarProps {
  db: Database | null
  isImporting: boolean
  isRefreshing: boolean
  reminderEnabled: boolean
  onImportBackup: (e: React.ChangeEvent<HTMLInputElement>) => void
  onImportIcal: (e: React.ChangeEvent<HTMLInputElement>) => void
  onExportBackup: () => void
  onRefresh: () => void
  onToggleReminder: () => void
  onTestNotification: () => void
}

export function CalendarToolbar({
  db,
  isImporting,
  isRefreshing,
  reminderEnabled,
  onImportBackup,
  onImportIcal,
  onExportBackup,
  onRefresh,
  onToggleReminder,
  onTestNotification,
}: CalendarToolbarProps) {
  return (
    <div className="mobile-actions grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
      <label className="w-full cursor-pointer rounded-md border border-slate-300 bg-white px-2 py-2 text-center text-[11px] font-semibold leading-tight text-slate-700 shadow-sm transition hover:bg-slate-50 sm:w-auto sm:px-4 sm:text-sm">
        <span>{isImporting ? 'Importando...' : 'Importar backup'}</span>
        <input
          className="sr-only"
          type="file"
          accept=".sqlite,.db,application/vnd.sqlite3"
          onChange={(e) => void onImportBackup(e)}
          disabled={isImporting || !db}
        />
      </label>
      <label className="w-full cursor-pointer rounded-md border border-slate-300 bg-white px-2 py-2 text-center text-[11px] font-semibold leading-tight text-slate-700 shadow-sm transition hover:bg-slate-50 sm:w-auto sm:px-4 sm:text-sm">
        <span>Importar ICS</span>
        <input
          className="sr-only"
          type="file"
          accept=".ics,.ical,text/calendar"
          onChange={(e) => void onImportIcal(e)}
          disabled={isImporting || !db}
        />
      </label>
      <button
        type="button"
        className="w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-[11px] font-semibold leading-tight text-slate-700 shadow-sm transition hover:bg-slate-50 sm:w-auto sm:px-4 sm:text-sm"
        onClick={onExportBackup}
        disabled={!db || isImporting}
      >
        Exportar backup
      </button>
      <button
        type="button"
        className="w-full rounded-md bg-blue-600 px-2 py-2 text-[11px] font-semibold leading-tight text-white shadow-sm transition hover:bg-blue-500 sm:w-auto sm:px-4 sm:text-sm"
        onClick={onRefresh}
        disabled={isRefreshing}
        aria-busy={isRefreshing}
      >
        {isRefreshing ? 'Atualizando...' : 'Atualizar'}
      </button>
      <button
        type="button"
        className="w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-[11px] font-semibold leading-tight text-slate-700 shadow-sm transition hover:bg-slate-50 sm:w-auto sm:px-4 sm:text-sm"
        onClick={onToggleReminder}
      >
        {reminderEnabled ? 'Lembretes ativos' : 'Ativar lembretes'}
      </button>
      <button
        type="button"
        className="w-full rounded-md border border-blue-200 bg-blue-50 px-2 py-2 text-[11px] font-semibold leading-tight text-blue-700 shadow-sm transition hover:bg-blue-100 sm:w-auto sm:px-4 sm:text-sm"
        onClick={() => void onTestNotification()}
      >
        Testar aviso
      </button>
    </div>
  )
}
