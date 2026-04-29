export type NotifyType = 'info' | 'success' | 'warning' | 'error'

export type NotifyPayload = {
  message: string
  type?: NotifyType
  timeoutMs?: number
}

export function notify(payload: NotifyPayload) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('app-notify', { detail: payload }))
}

export function notifyError(message: string, timeoutMs?: number) {
  notify({ message, type: 'error', timeoutMs })
}

export function notifySuccess(message: string, timeoutMs?: number) {
  notify({ message, type: 'success', timeoutMs })
}

export function notifyWarning(message: string, timeoutMs?: number) {
  notify({ message, type: 'warning', timeoutMs })
}

export function notifyInfo(message: string, timeoutMs?: number) {
  notify({ message, type: 'info', timeoutMs })
}
