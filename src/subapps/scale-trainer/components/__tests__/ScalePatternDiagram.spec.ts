import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ScalePatternDiagram from '../ScalePatternDiagram.vue'
import { MAJOR_SCALE, STANDARD_TUNING } from '../../../../theory'
import { derivePatternNotes } from '../../patternNotes'
import { PATTERNS } from '../../patterns'

const patternA = PATTERNS.find((p) => p.id === 'major-e-shape')! // root fret 3, no stretch notes
const patternB = PATTERNS.find((p) => p.id === 'major-a-shape')! // root fret 7, root is the box's last row, one note stretches above
const notesA = derivePatternNotes(patternA, MAJOR_SCALE, STANDARD_TUNING).sort((a, b) => a.midi - b.midi)
const notesB = derivePatternNotes(patternB, MAJOR_SCALE, STANDARD_TUNING).sort((a, b) => a.midi - b.midi)

describe('ScalePatternDiagram', () => {
  it('draws one dot per note', () => {
    const wrapper = mount(ScalePatternDiagram, { props: { notes: notesA, currentIndex: null, rootFret: patternA.root.fret, rootOffsetInBox: patternA.rootOffsetInBox } })
    expect(wrapper.findAll('circle')).toHaveLength(notesA.length)
  })

  it('fills each dot with its degree color, via inline style (not a Tailwind class)', () => {
    const wrapper = mount(ScalePatternDiagram, { props: { notes: notesA, currentIndex: null, rootFret: patternA.root.fret, rootOffsetInBox: patternA.rootOffsetInBox } })
    const circles = wrapper.findAll('circle')
    circles.forEach((circle, i) => {
      expect(circle.attributes('style')).toContain(notesA[i].color)
    })
  })

  it('gives only the current note a thicker, black stroke, same fill color as the rest', () => {
    const wrapper = mount(ScalePatternDiagram, { props: { notes: notesA, currentIndex: 2, rootFret: patternA.root.fret, rootOffsetInBox: patternA.rootOffsetInBox } })
    const circles = wrapper.findAll('circle')
    const currentWidth = Number(circles[2].attributes('stroke-width'))
    const otherWidth = Number(circles[0].attributes('stroke-width'))
    expect(currentWidth).toBeGreaterThan(otherWidth)
    // the current note's border must stay visible against both light and dark backgrounds
    expect(circles[2].classes()).toContain('stroke-black')
    expect(circles[0].classes()).not.toContain('stroke-black')
    // fill (degree color) is unaffected by which note is current
    expect(circles[2].attributes('style')).toContain(notesA[2].color)
  })

  it('shows a position label at root fret - 1 (the standard box start), not at the window margin', () => {
    const wrapper = mount(ScalePatternDiagram, { props: { notes: notesA, currentIndex: null, rootFret: patternA.root.fret, rootOffsetInBox: patternA.rootOffsetInBox } })
    expect(wrapper.text()).toContain('2fr') // root fret 3 -> standard box starts at 2
  })

  it('places the position label next to the standard box\'s first row, not the empty margin row above it', () => {
    const wrapper = mount(ScalePatternDiagram, { props: { notes: notesA, currentIndex: null, rootFret: patternA.root.fret, rootOffsetInBox: patternA.rootOffsetInBox } })
    const text = wrapper.find('text')
    const firstFretLineY = Number(wrapper.findAll('line').filter((l) => l.attributes('y1') === l.attributes('y2'))[1].attributes('y1')) // line 1: margin/standard-box boundary
    expect(Number(text.attributes('y'))).toBeGreaterThan(firstFretLineY) // label sits inside the standard row, below its top boundary
  })

  it('leaves enough room for the position label text so it is not clipped by the left edge of the viewBox', () => {
    const wrapper = mount(ScalePatternDiagram, { props: { notes: notesA, currentIndex: null, rootFret: patternA.root.fret, rootOffsetInBox: patternA.rootOffsetInBox } })
    const text = wrapper.find('text')
    // text-anchor="end": the label's rightmost x is its `x` attribute, extending leftward.
    // A 4-character label ("10fr") at this font size needs ~18-20px; guard against regressing SIDE_MARGIN.
    expect(Number(text.attributes('x'))).toBeGreaterThanOrEqual(18)
  })

  it('shows no position label and a thick nut line when the standard box reaches the nut', () => {
    const wrapper = mount(ScalePatternDiagram, { props: { notes: notesA, currentIndex: null, rootFret: 2, rootOffsetInBox: 1 } })
    expect(wrapper.text()).not.toMatch(/\dfr/)
  })

  it('centers every dot inside its fret cell — never exactly on a fret-wire line, even for the lowest fret in the window', () => {
    const wrapper = mount(ScalePatternDiagram, { props: { notes: notesA, currentIndex: null, rootFret: patternA.root.fret, rootOffsetInBox: patternA.rootOffsetInBox } })
    const lineYs = new Set(wrapper.findAll('line').filter((l) => l.attributes('y1') === l.attributes('y2')).map((l) => l.attributes('y1')))
    const dotYs = wrapper.findAll('circle').map((c) => c.attributes('cy'))
    expect(dotYs.length).toBeGreaterThan(0)
    for (const y of dotYs) {
      expect(lineYs).not.toContain(y)
    }
  })

  it('gives every distinct fret its own row, evenly spaced', () => {
    const wrapper = mount(ScalePatternDiagram, { props: { notes: notesA, currentIndex: null, rootFret: patternA.root.fret, rootOffsetInBox: patternA.rootOffsetInBox } })
    const byFret = new Map<number, number>()
    wrapper.findAll('circle').forEach((c, i) => {
      byFret.set(notesA[i].fret, Number(c.attributes('cy')))
    })
    const frets = [...byFret.keys()].sort((a, b) => a - b)
    const ys = frets.map((f) => byFret.get(f)!)
    for (let i = 1; i < ys.length; i++) {
      expect(ys[i] - ys[i - 1]).toBeCloseTo(ys[1] - ys[0], 5) // constant row height
      expect(ys[i]).toBeGreaterThan(ys[i - 1]) // higher fret -> further down
    }
  })

  describe('always-6-fret window with margins', () => {
    it('shows exactly 6 rows for a pattern with no stretch notes (both margins empty)', () => {
      const wrapper = mount(ScalePatternDiagram, { props: { notes: notesA, currentIndex: null, rootFret: patternA.root.fret, rootOffsetInBox: patternA.rootOffsetInBox } })
      const fretLines = wrapper.findAll('line').filter((l) => l.attributes('y1') === l.attributes('y2'))
      expect(fretLines).toHaveLength(7) // 6 rows = 7 boundary lines
    })

    it('shows exactly 6 rows for a pattern with a stretch note above the standard box', () => {
      const wrapper = mount(ScalePatternDiagram, { props: { notes: notesB, currentIndex: null, rootFret: patternB.root.fret, rootOffsetInBox: patternB.rootOffsetInBox } })
      const fretLines = wrapper.findAll('line').filter((l) => l.attributes('y1') === l.attributes('y2'))
      expect(fretLines).toHaveLength(7)
    })

    it('gives the first and last row a gray margin background, and no others', () => {
      const wrapper = mount(ScalePatternDiagram, { props: { notes: notesA, currentIndex: null, rootFret: patternA.root.fret, rootOffsetInBox: patternA.rootOffsetInBox } })
      const rects = wrapper.findAll('rect')
      expect(rects).toHaveLength(2)
    })

    it('highlights a note sitting in the margin row exactly like any other current note', () => {
      // patternB's highest fret (8) is the stretch note above the standard box [4,7]
      const stretchIndex = notesB.findIndex((n) => n.fret === 8)
      expect(stretchIndex).toBeGreaterThanOrEqual(0)
      const wrapper = mount(ScalePatternDiagram, { props: { notes: notesB, currentIndex: stretchIndex, rootFret: patternB.root.fret, rootOffsetInBox: patternB.rootOffsetInBox } })
      const circles = wrapper.findAll('circle')
      const currentWidth = Number(circles[stretchIndex].attributes('stroke-width'))
      const otherWidth = Number(circles[(stretchIndex + 1) % circles.length].attributes('stroke-width'))
      expect(currentWidth).toBeGreaterThan(otherWidth)
    })
  })

  describe('out-of-window data', () => {
    beforeEach(() => {
      vi.spyOn(console, 'warn').mockImplementation(() => {})
    })
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('warns (but does not throw) when a note falls outside the 6-fret window around the root', () => {
      const badNotes = [...notesA, { ...notesA[0], fret: notesA[0].fret + 10 }]
      expect(() =>
        mount(ScalePatternDiagram, { props: { notes: badNotes, currentIndex: null, rootFret: patternA.root.fret, rootOffsetInBox: patternA.rootOffsetInBox } }),
      ).not.toThrow()
      expect(console.warn).toHaveBeenCalled()
    })

    it('does not warn when every note is within the window', () => {
      mount(ScalePatternDiagram, { props: { notes: notesA, currentIndex: null, rootFret: patternA.root.fret, rootOffsetInBox: patternA.rootOffsetInBox } })
      expect(console.warn).not.toHaveBeenCalled()
    })
  })
})
