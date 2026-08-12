import { describe, expect, it } from 'vitest'
import { midiToPitch, noteName, noteNameToPitch, pitchToMidi } from '../notes'

describe('notes', () => {
  it('maps MIDI 60 to C4', () => {
    expect(midiToPitch(60)).toEqual({ pitchClass: 0, octave: 4 })
  })

  it('maps MIDI 64 to E4', () => {
    expect(noteName(midiToPitch(64))).toBe('E4')
  })

  it('round-trips pitch <-> midi', () => {
    for (let midi = 21; midi <= 108; midi++) {
      expect(pitchToMidi(midiToPitch(midi))).toBe(midi)
    }
  })

  it('formats note names with sharps', () => {
    expect(noteName(midiToPitch(61))).toBe('C#4')
  })

  it('round-trips noteName <-> noteNameToPitch', () => {
    for (let midi = 21; midi <= 108; midi++) {
      const pitch = midiToPitch(midi)
      expect(noteNameToPitch(noteName(pitch))).toEqual(pitch)
    }
  })

  it('rejects invalid note names', () => {
    expect(() => noteNameToPitch('H4')).toThrow()
    expect(() => noteNameToPitch('Cb4')).toThrow()
  })
})
