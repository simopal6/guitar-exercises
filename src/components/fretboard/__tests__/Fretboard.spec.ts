import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Fretboard from '../Fretboard.vue'
import { STANDARD_TUNING } from '../../../theory'

describe('Fretboard', () => {
  it('renders the low string (index 0) below the high string (index 5), TAB-style', () => {
    const wrapper = mount(Fretboard, { props: { tuning: STANDARD_TUNING } })
    const lines = wrapper.findAll('line[y1][y2]').filter((l) => l.attributes('y1') === l.attributes('y2'))
    const ys = lines.map((l) => Number(l.attributes('y1')))
    expect(Math.max(...ys)).toBeGreaterThan(Math.min(...ys))
    // 6 strings drawn
    expect(lines).toHaveLength(6)
  })

  it('renders a marker for each highlighted position with its label', () => {
    const wrapper = mount(Fretboard, {
      props: {
        tuning: STANDARD_TUNING,
        highlights: [
          { position: { stringIndex: 0, fret: 3 }, role: 'root', label: 'G' },
          { position: { stringIndex: 1, fret: 5 }, role: 'target', label: 'D' },
        ],
      },
    })
    expect(wrapper.findAll('circle.fill-indigo-500')).toHaveLength(1)
    expect(wrapper.findAll('circle.fill-emerald-500')).toHaveLength(1)
    expect(wrapper.text()).toContain('G')
    expect(wrapper.text()).toContain('D')
  })

  it('emits position-click with the right position when interactive', async () => {
    const wrapper = mount(Fretboard, {
      props: { tuning: STANDARD_TUNING, interactive: true, fretStart: 0, fretEnd: 5 },
    })
    await wrapper.get('[data-testid="cell-2-3"]').trigger('click')
    expect(wrapper.emitted('position-click')).toEqual([[{ stringIndex: 2, fret: 3 }]])
  })

  it('does not emit clicks when not interactive', async () => {
    const wrapper = mount(Fretboard, { props: { tuning: STANDARD_TUNING } })
    expect(wrapper.find('[data-testid="cell-2-3"]').exists()).toBe(false)
  })
})
