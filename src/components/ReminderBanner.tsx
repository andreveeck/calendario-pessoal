interface ReminderBannerProps {
  message: string
  onDismiss: () => void
}

export function ReminderBanner({ message, onDismiss }: ReminderBannerProps) {
  return (
    <div className="fixed left-4 right-4 top-4 z-50 mx-auto flex max-w-2xl animate-reminder-pulse items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 shadow-lg">
      <span aria-hidden="true" className="mt-0.5 text-lg">
        🔔
      </span>
      <p className="flex-1" role="status">
        {message}
      </p>
      <button
        type="button"
        className="rounded-md px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
        onClick={onDismiss}
      >
        Fechar
      </button>
    </div>
  )
}
