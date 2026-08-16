<script setup lang="ts">
import { computed } from 'vue'
import type { Chord, FingerLabel } from '../chord'
import { guitarStringNumberToIndex, soundingNoteName } from '../chord'

const props = defineProps<{ chord: Chord }>()

const STRING_COUNT = 6
const WINDOW_SIZE = 4 // fret cells shown (5 horizontal lines) — see ChordDiagram rationale in the plan
const CELL_WIDTH = 28
const CELL_HEIGHT = 30
const TOP_MARGIN = 22 // room for the X/O row above the grid
const SIDE_MARGIN = 14
const DOT_RADIUS = 9

const strings = computed(() => props.chord.strings)

// Only real fretted positions (not open/muted) anchor the window.
const frettedFrets = computed<number[]>(() => {
  const s = strings.value
  if (!s) return []
  return s.filter((f): f is number => typeof f === 'number' && f > 0)
})
const maxFret = computed(() => (frettedFrets.value.length ? Math.max(...frettedFrets.value) : 0))
const minFret = computed(() => (frettedFrets.value.length ? Math.min(...frettedFrets.value) : 0))

// Open-position chords (all of CAGED included) always show the nut, even if
// a couple of fretted notes reach fret 3-4. Moved shapes anchor on their
// lowest fretted note instead, with a "Nfr" label, like a printed chord book.
const showsNut = computed(() => maxFret.value <= WINDOW_SIZE)
const fretStart = computed(() => (showsNut.value ? 0 : minFret.value))
const positionLabel = computed(() => (showsNut.value ? null : `${fretStart.value}fr`))

const stringIndices = computed(() => Array.from({ length: STRING_COUNT }, (_, i) => i))
const fretLineIndices = computed(() => Array.from({ length: WINDOW_SIZE + 1 }, (_, i) => i))

const boardWidth = computed(() => (STRING_COUNT - 1) * CELL_WIDTH)
const boardHeight = computed(() => WINDOW_SIZE * CELL_HEIGHT)
const svgWidth = computed(() => SIDE_MARGIN * 2 + boardWidth.value)
const svgHeight = computed(() => TOP_MARGIN + boardHeight.value + 8)

function stringX(stringIndex: number): number {
  return SIDE_MARGIN + stringIndex * CELL_WIDTH
}
function fretLineY(lineIndex: number): number {
  return TOP_MARGIN + lineIndex * CELL_HEIGHT
}
/** On the top line when the fret equals fretStart (moved-position anchor note), centered in its cell otherwise. */
function fretDotY(fret: number): number {
  const rowFromTop = fret - fretStart.value
  if (rowFromTop <= 0) return fretLineY(0)
  if (rowFromTop > WINDOW_SIZE) return fretLineY(WINDOW_SIZE) - CELL_HEIGHT / 2 // clamp: shape wider than the window
  return fretLineY(rowFromTop - 1) + CELL_HEIGHT / 2
}

interface StringMark {
  stringIndex: number
  kind: 'x' | 'o' | 'dot'
  fret?: number
  finger?: FingerLabel | null
}

const stringMarks = computed<StringMark[]>(() => {
  const s = strings.value
  if (!s) return []
  return s.map((value, stringIndex) => {
    if (value === 'x') return { stringIndex, kind: 'x' as const }
    if (value === 0) return { stringIndex, kind: 'o' as const }
    return { stringIndex, kind: 'dot' as const, fret: value, finger: props.chord.fingers?.[stringIndex] ?? null }
  })
})

const barMarks = computed(() =>
  (props.chord.barres ?? []).map((barre) => {
    const fromIndex = guitarStringNumberToIndex(barre.fromString)
    const toIndex = guitarStringNumberToIndex(barre.toString)
    return {
      x1: stringX(Math.min(fromIndex, toIndex)),
      x2: stringX(Math.max(fromIndex, toIndex)),
      y: fretDotY(barre.fret),
    }
  }),
)
</script>

<template>
  <div v-if="strings" class="flex flex-col items-center gap-1">
    <p class="text-sm font-semibold text-slate-700 dark:text-slate-200">
      {{ chord.name }}
      <span v-if="chord.variant" class="ml-1 text-xs font-normal text-slate-400">({{ chord.variant }})</span>
    </p>

    <svg
      :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
      :style="{ width: `${svgWidth}px`, maxWidth: '100%', height: 'auto' }"
      class="select-none"
      role="img"
      :aria-label="`Diagramma accordo ${chord.name}`"
    >
      <text
        v-if="positionLabel"
        :x="SIDE_MARGIN - 6"
        :y="fretLineY(0) + 4"
        text-anchor="end"
        class="fill-slate-500 dark:fill-slate-400 text-[10px]"
      >{{ positionLabel }}</text>

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
        :y2="fretLineY(WINDOW_SIZE)"
        class="stroke-slate-400 dark:stroke-slate-500"
        stroke-width="1.5"
      />

      <rect
        v-for="(bar, i) in barMarks"
        :key="`bar-${i}`"
        :x="bar.x1 - DOT_RADIUS"
        :y="bar.y - DOT_RADIUS"
        :width="bar.x2 - bar.x1 + DOT_RADIUS * 2"
        :height="DOT_RADIUS * 2"
        :rx="DOT_RADIUS"
        class="fill-indigo-400 dark:fill-indigo-500"
      />

      <template v-for="mark in stringMarks" :key="`mark-${mark.stringIndex}`">
        <text
          v-if="mark.kind === 'x'"
          :x="stringX(mark.stringIndex)"
          :y="TOP_MARGIN - 10"
          text-anchor="middle"
          class="fill-slate-500 dark:fill-slate-400 text-xs font-semibold"
        >X</text>
        <text
          v-else-if="mark.kind === 'o'"
          :x="stringX(mark.stringIndex)"
          :y="TOP_MARGIN - 10"
          text-anchor="middle"
          class="fill-slate-500 dark:fill-slate-400 text-xs font-semibold"
        >O</text>
        <g v-else>
          <circle
            :cx="stringX(mark.stringIndex)"
            :cy="fretDotY(mark.fret!)"
            :r="DOT_RADIUS"
            class="fill-indigo-500"
            :aria-label="soundingNoteName(chord, mark.stringIndex) ?? undefined"
          />
          <text
            v-if="mark.finger"
            :x="stringX(mark.stringIndex)"
            :y="fretDotY(mark.fret!) + 3"
            text-anchor="middle"
            class="fill-white text-[9px] font-medium pointer-events-none"
          >{{ mark.finger }}</text>
        </g>
      </template>
    </svg>
  </div>
</template>
