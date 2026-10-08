import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ScalePatternDiagram from '../ScalePatternDiagram.vue'
import { MAJOR_SCALE, STANDARD_TUNING } from '../../../../theory'
import { derivePatternNotes } from '../../patternNotes'
import { PATTERNS } from '../../patterns'

const patternA = PATTERNS.find((p) => p.id === 'major-e-shape')! // root fret 3, no stretch notes
const patternB = PATTERNS.find((p) => p.id === 'major-a-shape')! // root fret 7, root is the box's last row, one note stretches above
const patternC = PATTERNS.find((p) => p.id === 'major-scale-3')! // root fret 4, degree 7 stretches identically past both margins
const notesA = derivePatternNotes(patternA, MAJOR_SCALE, STANDARD_TUNING).sort((a, b) => a.midi - b.midi)
const notesB = derivePatternNotes(patternB, MAJOR_SCALE, STANDARD_TUNING).sort((a, b) => a.midi - b.midi)
const notesC = derivePatternNotes(patternC, MAJOR_SCALE, STANDARD_TUNING).sort((a, b) => a.midi - b.midi)

describe('ScalePatternDiagram', () => {
  it('draws one dot per note', () => {
    const wrapper = mount(ScalePatternDiagram, { props: { notes: notesA, currentMidi: null, rootFret: patternA.root.fret, rootOffsetInBox: patternA.rootOffsetInBox } })
    expect(wrapper.findAll('circle')).toHaveLength(notesA.length)
  })

  it('fills each dot with its degree color, via inline style (not a Tailwind class)', () => {
    const wrapper = mount(ScalePatternDiagram, { props: { notes: notesA, currentMidi: null, rootFret: patternA.root.fret, rootOffsetInBox: patternA.rootOffsetInBox } })
    const circles = wrapper.findAll('circle')
    circles.forEach((circle, i) => {
      expect(circle.attributes('style')).toContain(notesA[i].color)
    })
  })

  it('gives only the current note a bigger radius, same fill color and border as the rest', () => {
    const wrapper = mount(ScalePatternDiagram, { props: { notes: notesA, currentMidi: notesA[2].midi, rootFret: patternA.root.fret, rootOffsetInBox: patternA.rootOffsetInBox } })
    const circles = wrapper.findAll('circle')
    const currentRadius = Number(circles[2].attributes('r'))
    const otherRadius = Number(circles[0].attributes('r'))
    expect(currentRadius).toBeGreaterThan(otherRadius)
    // border styling is identical regardless of which note is current — size alone marks it
    expect(circles[2].attributes('stroke-width')).toBe(circles[0].attributes('stroke-width'))
    expect(circles[2].classes()).toEqual(circles[0].classes())
    // fill (degree color) is unaffected by which note is current
    expect(circles[2].attributes('style')).toContain(notesA[2].color)
  })

  it('shows a thick nut line when the standard box reaches the nut', () => {
    const wrapper = mount(ScalePatternDiagram, { props: { notes: notesA, currentMidi: null, rootFret: 2, rootOffsetInBox: 1 } })
    const nutLine = wrapper.findAll('line').filter((l) => l.attributes('y1') === l.attributes('y2'))[0]
    expect(Number(nutLine.attributes('stroke-width'))).toBeGreaterThan(1.5)
  })

  it('centers every dot inside its fret cell — never exactly on a fret-wire line, even for the lowest fret in the window', () => {
    const wrapper = mount(ScalePatternDiagram, { props: { notes: notesA, currentMidi: null, rootFret: patternA.root.fret, rootOffsetInBox: patternA.rootOffsetInBox } })
    const lineYs = new Set(wrapper.findAll('line').filter((l) => l.attributes('y1') === l.attributes('y2')).map((l) => l.attributes('y1')))
    const dotYs = wrapper.findAll('circle').map((c) => c.attributes('cy'))
    expect(dotYs.length).toBeGreaterThan(0)
    for (const y of dotYs) {
      expect(lineYs).not.toContain(y)
    }
  })

  it('gives every distinct fret its own row, evenly spaced', () => {
    const wrapper = mount(ScalePatternDiagram, { props: { notes: notesA, currentMidi: null, rootFret: patternA.root.fret, rootOffsetInBox: patternA.rootOffsetInBox } })
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
      const wrapper = mount(ScalePatternDiagram, { props: { notes: notesA, currentMidi: null, rootFret: patternA.root.fret, rootOffsetInBox: patternA.rootOffsetInBox } })
      const fretLines = wrapper.findAll('line').filter((l) => l.attributes('y1') === l.attributes('y2'))
      expect(fretLines).toHaveLength(7) // 6 rows = 7 boundary lines
    })

    it('shows exactly 6 rows for a pattern with a stretch note above the standard box', () => {
      const wrapper = mount(ScalePatternDiagram, { props: { notes: notesB, currentMidi: null, rootFret: patternB.root.fret, rootOffsetInBox: patternB.rootOffsetInBox } })
      const fretLines = wrapper.findAll('line').filter((l) => l.attributes('y1') === l.attributes('y2'))
      expect(fretLines).toHaveLength(7)
    })

    it('gives the first and last row a gray margin background, and no others', () => {
      const wrapper = mount(ScalePatternDiagram, { props: { notes: notesA, currentMidi: null, rootFret: patternA.root.fret, rootOffsetInBox: patternA.rootOffsetInBox } })
      const rects = wrapper.findAll('rect')
      expect(rects).toHaveLength(2)
    })

    it('highlights a note sitting in the margin row exactly like any other current note', () => {
      // patternB's highest fret (8) is the stretch note above the standard box [4,7]
      const stretchIndex = notesB.findIndex((n) => n.fret === 8)
      expect(stretchIndex).toBeGreaterThanOrEqual(0)
      const otherIndex = notesB.findIndex((n) => n.midi !== notesB[stretchIndex].midi)
      const wrapper = mount(ScalePatternDiagram, { props: { notes: notesB, currentMidi: notesB[stretchIndex].midi, rootFret: patternB.root.fret, rootOffsetInBox: patternB.rootOffsetInBox } })
      const circles = wrapper.findAll('circle')
      const currentRadius = Number(circles[stretchIndex].attributes('r'))
      const otherRadius = Number(circles[otherIndex].attributes('r'))
      expect(currentRadius).toBeGreaterThan(otherRadius)
    })

    it('highlights every dot sharing the current pitch at once, not just one, when the same scale tone stretches past both margins', () => {
      // patternC's degree-7 pitch stretches identically past both margins: string 4 fret 5 (far) and string 3 fret 0 (near, the nut)
      const string4Fret5 = notesC.find((n) => n.stringIndex === 2 && n.fret === 5)!
      const string3Fret0 = notesC.find((n) => n.stringIndex === 3 && n.fret === 0)!
      const duplicatePitchNotes = [string4Fret5, string3Fret0]
      expect(duplicatePitchNotes.every(Boolean)).toBe(true)
      expect(duplicatePitchNotes[0].midi).toBe(duplicatePitchNotes[1].midi)

      const wrapper = mount(ScalePatternDiagram, {
        props: { notes: notesC, currentMidi: duplicatePitchNotes[0].midi, rootFret: patternC.root.fret, rootOffsetInBox: patternC.rootOffsetInBox },
      })
      const circles = wrapper.findAll('circle')
      const highlightedCount = circles.filter((c) => Number(c.attributes('r')) > 13).length
      expect(highlightedCount).toBe(2)
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
        mount(ScalePatternDiagram, { props: { notes: badNotes, currentMidi: null, rootFret: patternA.root.fret, rootOffsetInBox: patternA.rootOffsetInBox } }),
      ).not.toThrow()
      expect(console.warn).toHaveBeenCalled()
    })

    it('does not warn when every note is within the window', () => {
      mount(ScalePatternDiagram, { props: { notes: notesA, currentMidi: null, rootFret: patternA.root.fret, rootOffsetInBox: patternA.rootOffsetInBox } })
      expect(console.warn).not.toHaveBeenCalled()
    })
  })
})
