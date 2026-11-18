import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ElapsedTime from '../ElapsedTime.vue'
import { formatElapsed } from '../elapsedTime'

describe('formatElapsed', () => {
  it.each([
    [0, '0:00'],
    [7, '0:07'],
    [59, '0:59'],
    [60, '1:00'],
    [207, '3:27'],
    [4503, '75:03'],
  ])('%i s → %s', (seconds, expected) => {
    expect(formatElapsed(seconds)).toBe(expected)
  })
})

describe('ElapsedTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T10:00:00Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts at 0:00 and counts from mount', async () => {
    const wrapper = mount(ElapsedTime)
    expect(wrapper.get('[data-testid="elapsed-time"]').text()).toBe('0:00')
    await vi.advanceTimersByTimeAsync(65_000)
    expect(wrapper.text()).toBe('1:05')
  })

  it('follows the wall clock even if ticks are delayed', async () => {
    const wrapper = mount(ElapsedTime)
    vi.setSystemTime(new Date('2026-01-01T10:03:00Z')) // clock jumps, no ticks ran
    await vi.advanceTimersByTimeAsync(1000)
    expect(wrapper.text()).toBe('3:01')
  })

  it('clears its interval on unmount', () => {
    const wrapper = mount(ElapsedTime)
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
