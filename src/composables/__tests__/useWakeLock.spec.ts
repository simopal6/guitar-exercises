import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { useWakeLock } from '../useWakeLock'

// Tracks every mounted instance so afterEach can unmount them all — without
// this, a leaked instance's still-registered `visibilitychange` listener on
// the shared `document` would keep reacting in later tests.
let mountedWrappers: Array<() => void> = []

function withSetup<T>(composable: () => T): { result: T; unmount: () => void } {
  let result!: T
  const wrapper = mount({
    setup() {
      result = composable()
      return () => null
    },
  })
  const unmount = () => wrapper.unmount()
  mountedWrappers.push(unmount)
  return { result, unmount }
}

class FakeSentinel {
  private listeners: Record<string, Array<() => void>> = {}

  addEventListener(event: string, cb: () => void) {
    ;(this.listeners[event] ??= []).push(cb)
  }

  async release() {
    this.listeners.release?.forEach((cb) => cb())
  }
}

function installWakeLockApi(requestImpl: () => Promise<FakeSentinel>) {
  Object.defineProperty(navigator, 'wakeLock', {
    configurable: true,
    value: { request: vi.fn(requestImpl) },
  })
}

function removeWakeLockApi() {
  Reflect.deleteProperty(navigator, 'wakeLock')
}

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: state })
}

afterEach(() => {
  mountedWrappers.forEach((unmount) => {
    try {
      unmount()
    } catch {
      // already unmounted by the test itself — fine
    }
  })
  mountedWrappers = []
  removeWakeLockApi()
  setVisibility('visible')
  vi.restoreAllMocks()
})

describe('useWakeLock', () => {
  it('acquires a lock and reports isActive when supported', async () => {
    installWakeLockApi(async () => new FakeSentinel())
    const { result } = withSetup(useWakeLock)
    expect(result.isActive.value).toBe(false)
    await result.request()
    expect(result.isActive.value).toBe(true)
  })

  it('does nothing (no throw) when navigator.wakeLock is missing, e.g. old iOS Safari', async () => {
    removeWakeLockApi()
    const { result } = withSetup(useWakeLock)
    await expect(result.request()).resolves.toBeUndefined()
    expect(result.isActive.value).toBe(false)
  })

  it('catches a rejected request without throwing or breaking state', async () => {
    installWakeLockApi(() => Promise.reject(new Error('denied')))
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { result } = withSetup(useWakeLock)
    await expect(result.request()).resolves.toBeUndefined()
    expect(result.isActive.value).toBe(false)
    expect(warnSpy).toHaveBeenCalled()
  })

  it('release() clears the active state and actually releases the sentinel', async () => {
    let releaseSpy: ReturnType<typeof vi.spyOn> | undefined
    installWakeLockApi(async () => {
      const sentinel = new FakeSentinel()
      releaseSpy = vi.spyOn(sentinel, 'release')
      return sentinel
    })
    const { result } = withSetup(useWakeLock)
    await result.request()
    expect(result.isActive.value).toBe(true)
    await result.release()
    expect(result.isActive.value).toBe(false)
    expect(releaseSpy).toHaveBeenCalled()
  })

  it('re-acquires on visibilitychange while the caller still wants the lock (system revoked it)', async () => {
    let createCount = 0
    installWakeLockApi(async () => {
      createCount++
      return new FakeSentinel()
    })
    const { result } = withSetup(useWakeLock)
    await result.request()
    expect(createCount).toBe(1)

    // Simulate the browser revoking the lock when the page is backgrounded:
    // this fires the sentinel's own 'release' listener without our release() being called.
    const firstSentinel = await (navigator.wakeLock.request as ReturnType<typeof vi.fn>).mock.results[0].value
    await firstSentinel.release()
    expect(result.isActive.value).toBe(false)

    setVisibility('visible')
    document.dispatchEvent(new Event('visibilitychange'))
    await Promise.resolve() // flush the async visibilitychange handler

    expect(createCount).toBe(2) // re-acquired
    expect(result.isActive.value).toBe(true)
  })

  it('does NOT re-acquire on visibilitychange after an explicit release() (no dangling lock)', async () => {
    let createCount = 0
    installWakeLockApi(async () => {
      createCount++
      return new FakeSentinel()
    })
    const { result } = withSetup(useWakeLock)
    await result.request()
    await result.release()
    expect(createCount).toBe(1)

    setVisibility('visible')
    document.dispatchEvent(new Event('visibilitychange'))
    await Promise.resolve()

    expect(createCount).toBe(1) // not re-acquired
    expect(result.isActive.value).toBe(false)
  })

  it('releases the lock on unmount as a safety net', async () => {
    let releaseSpy: ReturnType<typeof vi.spyOn> | undefined
    installWakeLockApi(async () => {
      const sentinel = new FakeSentinel()
      releaseSpy = vi.spyOn(sentinel, 'release')
      return sentinel
    })
    const { result, unmount } = withSetup(useWakeLock)
    await result.request()
    unmount()
    await Promise.resolve()
    expect(releaseSpy).toHaveBeenCalled()
  })
})
