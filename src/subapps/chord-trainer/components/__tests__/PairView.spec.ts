import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PairView from '../PairView.vue'
import type { Chord } from '../../chord'

const pair: [Chord, Chord] = [
  { id: 'c-open', name: 'C' },
  { id: 'a-open', name: 'A' },
]

describe('PairView', () => {
  it('emits skip when the "Salta" button is clicked', async () => {
    const wrapper = mount(PairView, {
      props: { pair, remainingSeconds: 42, turnState: 'active', fingeringRevealed: false },
    })
    const skipButton = wrapper.findAll('button').find((b) => b.text() === 'Salta')!
    await skipButton.trigger('click')
    expect(wrapper.emitted('skip')).toHaveLength(1)
  })

  it('shows the "Salta" button during the gap too', () => {
    const wrapper = mount(PairView, {
      props: { pair, remainingSeconds: 2, turnState: 'gap', fingeringRevealed: false },
    })
    expect(wrapper.findAll('button').some((b) => b.text() === 'Salta')).toBe(true)
  })
})
