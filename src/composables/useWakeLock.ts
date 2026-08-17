import { onUnmounted, readonly, ref, type Ref } from 'vue'

export interface WakeLock {
  isActive: Readonly<Ref<boolean>>
  request(): Promise<void>
  release(): Promise<void>
}

/**
 * Screen Wake Lock API wrapper, fully defensive: if the API is missing or a
 * request fails (old iOS Safari, permission denied, ...) this silently
 * no-ops rather than throwing — the app must work identically either way,
 * just without keeping the screen awake.
 *
 * The lock is released by the browser whenever the page goes to the
 * background and does NOT come back on its own; this re-requests it once
 * the page is visible again, but only while the caller still wants it (i.e.
 * between a request() and the matching release()) — so a repeated
 * start/stop cycle never leaves a lock dangling.
 */
export function useWakeLock(): WakeLock {
  const isActive = ref(false)
  let sentinel: WakeLockSentinel | null = null
  let shouldHold = false // caller's intent: true from request() until release()

  function isSupported(): boolean {
    return 'wakeLock' in navigator
  }

  async function request(): Promise<void> {
    shouldHold = true
    if (sentinel) return // already holding one
    if (!isSupported()) return
    try {
      sentinel = await navigator.wakeLock.request('screen')
      isActive.value = true
      sentinel.addEventListener('release', () => {
        // Fires both on our own release() and when the system revokes it
        // (e.g. backgrounded) — clear the reference in both cases, or the
        // visibilitychange re-acquire below would see a stale sentinel and
        // wrongly skip re-requesting.
        isActive.value = false
        sentinel = null
      })
    } catch (error) {
      console.warn('[useWakeLock] request failed, continuing without a wake lock', error)
      isActive.value = false
    }
  }

  async function release(): Promise<void> {
    shouldHold = false
    if (sentinel) {
      try {
        await sentinel.release()
      } catch {
        // already released or unsupported — nothing to do
      }
      sentinel = null
    }
    isActive.value = false
  }

  async function onVisibilityChange(): Promise<void> {
    if (document.visibilityState === 'visible' && shouldHold && !sentinel) {
      await request()
    }
  }

  document.addEventListener('visibilitychange', onVisibilityChange)

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange)
    release()
  })

  return {
    isActive: readonly(isActive),
    request,
    release,
  }
}
