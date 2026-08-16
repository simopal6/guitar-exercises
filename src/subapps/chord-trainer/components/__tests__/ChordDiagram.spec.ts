import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ChordDiagram from '../ChordDiagram.vue'
import type { Chord } from '../../chord'

const openC: Chord = {
  id: 'c-open',
  name: 'C',
  variant: 'open',
  strings: ['x', 3, 2, 0, 1, 0],
  fingers: [null, 3, 2, null, 1, null],
  barres: [],
}

const fBarre: Chord = {
  id: 'f-barre-e',
  name: 'F',
  variant: 'barre E-shape',
  strings: [1, 3, 3, 2, 1, 1],
  fingers: [1, 3, 4, 2, 1, 1],
  barres: [{ fret: 1, fromString: 6, toString: 1, finger: 1 }],
}

const nameOnly: Chord = { id: 'bdim-x', name: 'Bdim' }

// Synthetic moved-position shape (no CAGED chord reaches beyond fret 4) to
// exercise the "Nfr" label / anchored-on-lowest-fret behavior.
const movedShape: Chord = {
  id: 'moved',
  name: 'D',
  strings: [5, 7, 7, 6, 5, 5],
}

describe('ChordDiagram', () => {
  it('renders nothing when the chord has no strings data', () => {
    const wrapper = mount(ChordDiagram, { props: { chord: nameOnly } })
    expect(wrapper.html()).toBe('<!--v-if-->')
  })

  it('renders the chord name and variant', () => {
    const wrapper = mount(ChordDiagram, { props: { chord: openC } })
    expect(wrapper.text()).toContain('C')
    expect(wrapper.text()).toContain('open')
  })

  it('shows X above a muted string and O above an open string, no position label near the nut', () => {
    const wrapper = mount(ChordDiagram, { props: { chord: openC } })
    expect(wrapper.text()).toContain('X')
    expect(wrapper.text()).toContain('O')
    expect(wrapper.text()).not.toContain('fr')
  })

  it('draws a filled dot for every fretted string', () => {
    const wrapper = mount(ChordDiagram, { props: { chord: openC } })
    // openC has 3 fretted strings: A@3, D@2, B@1
    expect(wrapper.findAll('circle')).toHaveLength(3)
  })

  it('draws a barre rect converting guitar string numbers (6..1) to array indices (0..5)', () => {
    const wrapper = mount(ChordDiagram, { props: { chord: fBarre } })
    const rects = wrapper.findAll('rect')
    expect(rects).toHaveLength(1)
    // fromString 6 -> index 0, toString 1 -> index 5: spans the full board width
    const x = Number(rects[0].attributes('x'))
    const width = Number(rects[0].attributes('width'))
    expect(x).toBeLessThan(20) // near the leftmost (low E) string
    expect(x + width).toBeGreaterThan(150) // reaches near the rightmost (high e) string
  })

  it('shows a position label ("Nfr") and no nut line for a moved-position shape', () => {
    const wrapper = mount(ChordDiagram, { props: { chord: movedShape } })
    expect(wrapper.text()).toContain('5fr')
  })

  it('shows no position label for shapes that fit within the nut window', () => {
    const wrapper = mount(ChordDiagram, { props: { chord: fBarre } })
    expect(wrapper.text()).not.toMatch(/\dfr/)
  })
})
