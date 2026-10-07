<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import type { DerivedNote } from '../patternNotes'

const props = defineProps<{
  notes: DerivedNote[]
  /** Index into `notes` of the note to emphasize, or null when nothing is current. */
  currentIndex: number | null
  /** The pattern's root fret — anchors the standard 4-fret box, see below. */
  rootFret: number
}>()

const STRING_COUNT = 6
const CELL_WIDTH = 28
const CELL_HEIGHT = 30
const TOP_MARGIN = 16
// Wide enough to fit the position label ("10fr" at the widest) without it
// being clipped by the SVG viewport's left edge — see positionLabel below.
const SIDE_MARGIN = 26
const DOT_RADIUS = 9
const STANDARD_BOX_SIZE = 4
const MARGIN_ROWS = 1 // on each side of the standard box

// Border thickness/opacity — the only two values to touch to re-tune how
// "current note" emphasis reads, independent of the degree fill color.
const DOT_STROKE_WIDTH = 1.5
const DOT_STROKE_OPACITY = 0.6
const CURRENT_STROKE_WIDTH = 4.5
const CURRENT_STROKE_OPACITY = 1

// Not a fixed zoom level like ChordDiagram (one chord shown at a time, many
// in sequence): a pattern is static for the whole practice session. The
// window is always exactly "standard box + 1 margin fret on each side" —
// fixed size, so a pattern with a stretch note (reaching outside the 4-fret
// box) looks visibly different from a mistake, not from a shape that keeps
// resizing. Anchored on the root fret (not on the notes' own min/max): only
// the root tells us WHICH side is "standard" vs "stretch" when a pattern
// spans more than 4 frets.
const standardBoxStart = computed(() => props.rootFret - 1)
const fretStart = computed(() => Math.max(0, standardBoxStart.value - MARGIN_ROWS))
const showsNut = computed(() => fretStart.value === 0)
const positionLabel = computed(() => (showsNut.value ? null : `${standardBoxStart.value}fr`))
// Normally always 6 rows (1 margin + 4 standard + 1 margin); clipped only
// when the box reaches the nut, since there's no fret below 0 to reserve.
const windowSize = computed(() => standardBoxStart.value + STANDARD_BOX_SIZE + MARGIN_ROWS - fretStart.value)
// The bottom margin row only exists if it wasn't clipped away at the nut
// (see fretStart above); the top margin row is always the window's last row.
const hasBottomMargin = computed(() => standardBoxStart.value - MARGIN_ROWS >= 0)
const marginRowIndices = computed(() => {
  const rows: number[] = []
  if (hasBottomMargin.value) rows.push(0)
  rows.push(windowSize.value - 1)
  return rows
})

const stringIndices = computed(() => Array.from({ length: STRING_COUNT }, (_, i) => i))
const fretLineIndices = computed(() => Array.from({ length: windowSize.value + 1 }, (_, i) => i))

const boardWidth = computed(() => (STRING_COUNT - 1) * CELL_WIDTH)
const boardHeight = computed(() => windowSize.value * CELL_HEIGHT)
const svgWidth = computed(() => SIDE_MARGIN * 2 + boardWidth.value)
const svgHeight = computed(() => TOP_MARGIN + boardHeight.value + 8)

function stringX(stringIndex: number): number {
  return SIDE_MARGIN + stringIndex * CELL_WIDTH
}
function fretLineY(lineIndex: number): number {
  return TOP_MARGIN + lineIndex * CELL_HEIGHT
}
/** Every fret gets its own full cell — including fretStart — so the dot always sits centered between two fret wires, never on one. */
function fretDotY(fret: number): number {
  return fretLineY(fret - fretStart.value) + CELL_HEIGHT / 2
}

// Defensive: a note outside the 6-fret window means the pattern's hard-coded
// positions don't agree with its own root — a data-authoring bug to flag,
// not something to crash the UI over.
watchEffect(() => {
  const outOfRange = props.notes.filter((n) => n.fret < fretStart.value || n.fret > fretStart.value + windowSize.value - 1)
  if (outOfRange.length > 0) {
    console.warn('[ScalePatternDiagram] note(s) outside the 6-fret window around the root:', outOfRange)
  }
})
</script>

<template>
  <svg
    :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
    :style="{ width: `${svgWidth}px`, maxWidth: '100%', height: 'auto' }"
    class="select-none"
    role="img"
    aria-label="Posizione della scala sul manico"
  >
    <text
      v-if="positionLabel"
      :x="SIDE_MARGIN - 6"
      :y="fretLineY(standardBoxStart - fretStart) + 4"
      text-anchor="end"
      class="fill-slate-500 dark:fill-slate-400 text-[10px]"
    >{{ positionLabel }}</text>

    <rect
      v-for="row in marginRowIndices"
      :key="`margin-${row}`"
      :x="SIDE_MARGIN"
      :y="fretLineY(row)"
      :width="boardWidth"
      :height="CELL_HEIGHT"
      class="fill-slate-100 dark:fill-slate-800"
    />

    <line
      v-for="i in fretLineIndices"
      :key="`fret-${i}`"
      :x1="SIDE_MARGIN"
      :x2="SIDE_MARGIN + boardWidth"
      :y1="fretLineY(i)"
      :y2="fretLineY(i)"
      class="stroke-slate-500 dark:stroke-slate-400"
      :stroke-width="i === 0 && showsNut ? 5 : 1.5"
    />

    <line
      v-for="i in stringIndices"
      :key="`string-${i}`"
      :x1="stringX(i)"
      :x2="stringX(i)"
      :y1="fretLineY(0)"
      :y2="fretLineY(windowSize)"
      class="stroke-slate-400 dark:stroke-slate-500"
      stroke-width="1.5"
    />

    <circle
      v-for="(note, index) in notes"
      :key="`${note.stringIndex}-${note.fret}`"
      :cx="stringX(note.stringIndex)"
      :cy="fretDotY(note.fret)"
      :r="DOT_RADIUS"
      :style="{ fill: note.color }"
      :stroke-width="index === currentIndex ? CURRENT_STROKE_WIDTH : DOT_STROKE_WIDTH"
      :stroke-opacity="index === currentIndex ? CURRENT_STROKE_OPACITY : DOT_STROKE_OPACITY"
      :class="index === currentIndex ? 'stroke-black' : 'stroke-white dark:stroke-slate-950'"
      :aria-label="note.noteName"
    />
  </svg>
</template>
