interface SearchBarProps {
  searchQuery: string
  filterLabel: string | null
  allLabels: string[]
  onSearchChange: (query: string) => void
  onFilterChange: (label: string | null) => void
  onClearFilters: () => void
}

export function SearchBar({
  searchQuery,
  filterLabel,
  allLabels,
  onSearchChange,
  onFilterChange,
  onClearFilters,
}: SearchBarProps) {
  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <div className="relative flex-1">
        <input
          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          type="search"
          placeholder="Buscar eventos por título, descrição ou local..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <svg
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>
      <select
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-auto"
        value={filterLabel ?? ''}
        onChange={(e) => onFilterChange(e.target.value || null)}
      >
        <option value="">Todas as categorias</option>
        {allLabels.map((label) => (
          <option key={label} value={label}>
            {label}
          </option>
        ))}
      </select>
      {(searchQuery || filterLabel) && (
        <button
          type="button"
          className="whitespace-nowrap text-sm font-medium text-slate-500 hover:text-slate-800"
          onClick={onClearFilters}
        >
          Limpar filtros
        </button>
      )}
    </div>
  )
}
