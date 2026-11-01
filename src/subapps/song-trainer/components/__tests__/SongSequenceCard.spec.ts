import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SongSequenceCard from '../SongSequenceCard.vue'
import type { Song } from '../../songs'

const songs: Song[] = [
  { id: 'a', title: 'Alpha' },
  { id: 'b', title: 'Beta', artist: 'Band' },
  { id: 'c', title: 'Gamma' },
]

const baseProps = {
  title: 'Ripasso di oggi',
  songs,
  positions: [4, 5, 6],
  total: 8,
  lap: 2,
  advanceLabel: 'Fatto → prossime 3',
}

describe('SongSequenceCard', () => {
  it("shows today's songs and where they are in the list", () => {
    const wrapper = mount(SongSequenceCard, { props: baseProps })
    expect(wrapper.text()).toContain('Alpha')
    expect(wrapper.text()).toContain('Band')
    expect(wrapper.text()).toContain('giro 2 · 4–6 di 8')
  })

  it('lists the positions one by one when the batch wraps past the end', () => {
    const wrapper = mount(SongSequenceCard, { props: { ...baseProps, positions: [7, 8, 1] } })
    expect(wrapper.text()).toContain('7, 8, 1 di 8')
  })

  it('emits advance and back from its buttons', async () => {
    const wrapper = mount(SongSequenceCard, { props: baseProps })
    const buttons = wrapper.findAll('button')
    await buttons.find((b) => b.text() === 'Fatto → prossime 3')!.trigger('click')
    await buttons.find((b) => b.text().includes('indietro'))!.trigger('click')
    expect(wrapper.emitted('advance')).toHaveLength(1)
    expect(wrapper.emitted('back')).toHaveLength(1)
  })

  it('shows a message and no buttons when the repertoire is empty', () => {
    const wrapper = mount(SongSequenceCard, { props: { ...baseProps, songs: [], positions: [], total: 0 } })
    expect(wrapper.text()).toContain('Nessuna canzone')
    expect(wrapper.findAll('button')).toHaveLength(0)
  })
})
