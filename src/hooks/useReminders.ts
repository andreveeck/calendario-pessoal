import { useCallback, useEffect, useRef, useState } from 'react'
import type { IEvent } from '../types/event'

const NOTIFICATION_CACHE_KEY = 'webcal-fired-reminders'

const getRemindersCache = (): Set<string> => {
  if (typeof window === 'undefined') return new Set()

  try {
    const stored = window.localStorage.getItem(NOTIFICATION_CACHE_KEY)
    const parsed = stored ? (JSON.parse(stored) as string[]) : []
    return new Set(parsed)
  } catch {
    return new Set()
  }
}

const saveRemindersCache = (reminders: Set<string>) => {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(NOTIFICATION_CACHE_KEY, JSON.stringify([...reminders]))
  } catch {
    // Ignore storage quota issues while the app is still usable.
  }
}

const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window) || Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission === 'denied') return false

  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

const sendNativeNotification = (event: IEvent) => {
  const reminderMinutes = event.reminder_minutes ?? 0
  const reminderText = reminderMinutes > 0 ? `Lembrete ${reminderMinutes} min antes` : 'Lembrete do evento'
  const scheduledAt = new Date(event.start_date)
  const timeLabel = scheduledAt.toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })

  // Tentar via Service Worker (funciona em background)
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SHOW_NOTIFICATION',
      title: `🔔 ${event.title}`,
      body: `${timeLabel} (${reminderText})`,
    })
    return
  }

  // Fallback: Notification API direta
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(`🔔 ${event.title}`, {
      body: `${timeLabel} (${reminderText})`,
      icon: '/favicon.svg',
      tag: `webcal-${event.id}`,
    })
  }
}

const playAlertSound = () => {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return

  const audioContext = new AudioContext()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(880, audioContext.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.3)
  gainNode.gain.setValueAtTime(0.08, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3)

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  oscillator.start()
  oscillator.stop(audioContext.currentTime + 0.3)
}

const triggerHapticFeedback = () => {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return

  try {
    navigator.vibrate([200, 100, 200])
  } catch {
    // Vibration may be blocked by the browser or absent.
  }
}

export function useReminders(eventRecords: IEvent[]) {
  const [reminderEnabled, setReminderEnabled] = useState(true)
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null)
  const firedRemindersRef = useRef<Set<string>>(getRemindersCache())

  const showReminderNotification = useCallback((event: IEvent) => {
    const reminderMinutes = event.reminder_minutes ?? 0
    const reminderText = reminderMinutes > 0 ? `Lembrete ${reminderMinutes} min antes` : 'Lembrete do evento'
    const scheduledAt = new Date(event.start_date)
    const timeLabel = scheduledAt.toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    })

    playAlertSound()
    triggerHapticFeedback()
    setNotificationMessage(`Lembrete: ${event.title} — ${timeLabel} (${reminderText})`)
    sendNativeNotification(event)
  }, [])

  const triggerTestNotification = useCallback(() => {
    const testEvent: IEvent = {
      id: 'demo-reminder',
      title: 'Teste de lembrete',
      description: 'Aviso interno do app',
      location: '',
      all_day: false,
      start_date: new Date(Date.now() + 60_000).toISOString(),
      end_date: new Date(Date.now() + 120_000).toISOString(),
      color: '#2563eb',
      reminder_minutes: 1,
    }

    showReminderNotification(testEvent)
    setNotificationMessage('Teste de lembrete interno enviado. O banner do app apareceu para simular o aviso.')
  }, [showReminderNotification])

  // Sincronizar cache no beforeunload
  useEffect(() => {
    const syncCache = () => saveRemindersCache(firedRemindersRef.current)

    window.addEventListener('beforeunload', syncCache)

    return () => {
      window.removeEventListener('beforeunload', syncCache)
      syncCache()
    }
  }, [])

  // Polling de lembretes
  useEffect(() => {
    if (!reminderEnabled || !eventRecords.length) return

    const checkReminders = () => {
      const now = Date.now()
      const nextReminders = new Set(firedRemindersRef.current)
      let hasNewReminder = false

      eventRecords.forEach((event) => {
        const reminderMinutes = event.reminder_minutes ?? 0
        const reminderAt = new Date(event.start_date).getTime() - reminderMinutes * 60 * 1000
        const reminderKey = `${event.id}-${reminderMinutes}-${event.start_date}`

        if (!Number.isFinite(reminderAt) || nextReminders.has(reminderKey)) return

        // Dispara o lembrete se o horário já passou (inclusive quando o usuário volta da aba)
        if (now >= reminderAt) {
          nextReminders.add(reminderKey)
          hasNewReminder = true
          showReminderNotification(event)
        }
      })

      if (hasNewReminder) {
        firedRemindersRef.current = nextReminders
        saveRemindersCache(nextReminders)
      }
    }

    checkReminders()
    const intervalId = window.setInterval(checkReminders, 10_000)
    document.addEventListener('visibilitychange', checkReminders)

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', checkReminders)
    }
  }, [eventRecords, reminderEnabled, showReminderNotification])

  // Solicitar permissão de notificação ao ativar lembretes
  const handleToggleReminder = useCallback((enabled: boolean) => {
    setReminderEnabled(enabled)
    if (enabled) {
      void requestNotificationPermission()
    }
  }, [])

  return {
    reminderEnabled,
    setReminderEnabled: handleToggleReminder,
    notificationMessage,
    setNotificationMessage,
    triggerTestNotification,
  }
}
