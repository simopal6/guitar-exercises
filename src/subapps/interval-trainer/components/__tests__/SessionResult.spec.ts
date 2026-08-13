import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SessionResult from '../SessionResult.vue'

describe('SessionResult', () => {
  it('shows the final score and the best score when it is not a new record', () => {
    const wrapper = mount(SessionResult, { props: { score: 5, bestScore: 9, isNewBest: false } })
    expect(wrapper.text()).toContain('5')
    expect(wrapper.text()).toContain('Record')
    expect(wrapper.text()).toContain('9')
    expect(wrapper.text()).not.toContain('Nuovo record')
  })

  it('shows a new-record badge when isNewBest is true', () => {
    const wrapper = mount(SessionResult, { props: { score: 10, bestScore: 10, isNewBest: true } })
    expect(wrapper.text()).toContain('Nuovo record')
  })

  it('emits play-again and change-settings on the respective buttons', async () => {
    const wrapper = mount(SessionResult, { props: { score: 3, bestScore: 3, isNewBest: true } })
    const buttons = wrapper.findAll('button')
    const playAgain = buttons.find((b) => b.text() === 'Rigioca')
    const changeSettings = buttons.find((b) => b.text() === 'Cambia impostazioni')

    await playAgain?.trigger('click')
    await changeSettings?.trigger('click')

    expect(wrapper.emitted('play-again')).toHaveLength(1)
    expect(wrapper.emitted('change-settings')).toHaveLength(1)
  })
})
