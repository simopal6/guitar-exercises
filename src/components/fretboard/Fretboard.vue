<script setup lang="ts">
import { computed } from 'vue'
import type { FretPosition, Tuning } from '../../theory'
import { positionToNoteName } from '../../theory'
import type { HighlightedPosition, HighlightRole } from './types'

const props = withDefaults(
  defineProps<{
    tuning: Tuning
    fretStart?: number
    fretEnd?: number
    highlights?: HighlightedPosition[]
    interactive?: boolean
    showFretNumbers?: boolean
    showOpenStringLabels?: boolean
  }>(),
  {
    fretStart: 0,
    fretEnd: 12,
    highlights: () => [],
    interactive: false,
    showFretNumbers: true,
    showOpenStringLabels: true,
  },
)

const emit = defineEmits<{
  'position-click': [position: FretPosition]
}>()

const CELL_WIDTH = 56
const CELL_HEIGHT = 34
const TOP_MARGIN = 12
const SINGLE_DOT_FRETS = new Set([3, 5, 7, 9, 15, 17, 19, 21])
const DOUBLE_DOT_FRETS = new Set([12, 24])

const ROLE_CLASSES: Record<HighlightRole, string> = {
  root: 'fill-indigo-500 stroke-indigo-700',
  target: 'fill-emerald-500 stroke-emerald-700',
  neutral: 'fill-slate-400 stroke-slate-600',
  selected: 'fill-amber-400 stroke-amber-600',
  correct: 'fill-emerald-500 stroke-emerald-700',
  incorrect: 'fill-rose-500 stroke-rose-700',
}

const stringCount = computed(() => props.tuning.length)
const stringIndices = computed(() => Array.from({ length: stringCount.value }, (_, i) => i))

const frets = computed(() => {
  const list: number[] = []
  for (let f = props.fretStart; f <= props.fretEnd; f++) list.push(f)
  return list
})

const leftMargin = computed(() => (props.showOpenStringLabels ? 28 : 8))
const boardWidth = computed(() => frets.value.length * CELL_WIDTH)
const boardHeight = computed(() => (stringCount.value - 1) * CELL_HEIGHT)
const svgWidth = computed(() => leftMargin.value + boardWidth.value + 8)
const svgHeight = computed(
  () => TOP_MARGIN + boardHeight.value + (props.showFretNumbers ? 20 : 0) + 8,
)

const fretWireIndices = computed(() => {
  const wires: number[] = []
  for (let i = 0; i <= frets.value.length; i++) wires.push(i)
  return wires
})

const dotFrets = computed(() =>
  frets.value.filter((f) => SINGLE_DOT_FRETS.has(f) || DOUBLE_DOT_FRETS.has(f)),
)

// stringIndex 0 (lowest-pitched string) is drawn at the bottom row, matching TAB convention.
function stringY(stringIndex: number): number {
  return TOP_MARGIN + (stringCount.value - 1 - stringIndex) * CELL_HEIGHT
}

function fretX(fret: number): number {
  return leftMargin.value + (fret - props.fretStart) * CELL_WIDTH + CELL_WIDTH / 2
}

function fretWireX(wireIndex: number): number {
  return leftMargin.value + wireIndex * CELL_WIDTH
}

function isNutWire(wireIndex: number): boolean {
  return props.fretStart === 0 && wireIndex === 0
}

function isDoubleDot(fret: number): boolean {
  return DOUBLE_DOT_FRETS.has(fret)
}

const highlightByCell = computed(() => {
  const map = new Map<string, HighlightedPosition>()
  for (const h of props.highlights) {
    map.set(`${h.position.stringIndex}:${h.position.fret}`, h)
  }
  return map
})

function highlightAt(stringIndex: number, fret: number): HighlightedPosition | undefined {
  return highlightByCell.value.get(`${stringIndex}:${fret}`)
}

function markerClasses(role: HighlightRole): string {
  return ROLE_CLASSES[role]
}

function openStringLabel(stringIndex: number): string {
  return positionToNoteName(props.tuning, { stringIndex, fret: 0 }).replace(/\d+$/, '')
}

function onCellClick(stringIndex: number, fret: number) {
  if (!props.interactive) return
  emit('position-click', { stringIndex, fret })
}
</script>

<template>
  <svg
    :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
    :style="{ width: `${svgWidth}px`, maxWidth: '100%', height: 'auto' }"
    class="select-none"
    role="img"
    aria-label="Guitar fretboard"
  >
    <line
      v-for="stringIndex in stringIndices"
      :key="`string-${stringIndex}`"
      :x1="fretWireX(0)"
      :x2="fretWireX(frets.length)"
      :y1="stringY(stringIndex)"
      :y2="stringY(stringIndex)"
      class="stroke-slate-400 dark:stroke-slate-500"
      stroke-width="1.5"
    />

    <line
      v-for="wireIndex in fretWireIndices"
      :key="`fret-${wireIndex}`"
      :x1="fretWireX(wireIndex)"
      :x2="fretWireX(wireIndex)"
      :y1="TOP_MARGIN"
      :y2="TOP_MARGIN + boardHeight"
      class="stroke-slate-500 dark:stroke-slate-400"
      :stroke-width="isNutWire(wireIndex) ? 5 : 1.5"
    />

    <template v-for="fret in dotFrets" :key="`dot-${fret}`">
      <circle
        v-if="!isDoubleDot(fret)"
        :cx="fretX(fret)"
        :cy="TOP_MARGIN + boardHeight / 2"
        r="3"
        class="fill-slate-300 dark:fill-slate-600"
      />
      <template v-else>
        <circle
          :cx="fretX(fret)"
          :cy="TOP_MARGIN + boardHeight / 3"
          r="3"
          class="fill-slate-300 dark:fill-slate-600"
        />
        <circle
          :cx="fretX(fret)"
          :cy="TOP_MARGIN + (boardHeight * 2) / 3"
          r="3"
          class="fill-slate-300 dark:fill-slate-600"
        />
      </template>
    </template>

    <g v-if="showOpenStringLabels">
      <text
        v-for="stringIndex in stringIndices"
        :key="`label-${stringIndex}`"
        :x="leftMargin - 8"
        :y="stringY(stringIndex) + 4"
        text-anchor="end"
        class="fill-slate-500 dark:fill-slate-400 text-[10px]"
      >{{ openStringLabel(stringIndex) }}</text>
    </g>

    <g v-if="showFretNumbers">
      <text
        v-for="fret in frets"
        :key="`fretnum-${fret}`"
        :x="fretX(fret)"
        :y="TOP_MARGIN + boardHeight + 14"
        text-anchor="middle"
        class="fill-slate-500 dark:fill-slate-400 text-[10px]"
      >{{ fret }}</text>
    </g>

    <g v-for="stringIndex in stringIndices" :key="`row-${stringIndex}`">
      <g v-for="fret in frets" :key="`cell-${stringIndex}-${fret}`">
        <rect
          v-if="interactive"
          :data-testid="`cell-${stringIndex}-${fret}`"
          :x="fretX(fret) - CELL_WIDTH / 2"
          :y="stringY(stringIndex) - CELL_HEIGHT / 2"
          :width="CELL_WIDTH"
          :height="CELL_HEIGHT"
          fill="transparent"
          class="cursor-pointer"
          @click="onCellClick(stringIndex, fret)"
        />
        <g v-if="highlightAt(stringIndex, fret)">
          <circle
            :cx="fretX(fret)"
            :cy="stringY(stringIndex)"
            r="10"
            :class="markerClasses(highlightAt(stringIndex, fret)!.role)"
            stroke-width="1.5"
          />
          <text
            v-if="highlightAt(stringIndex, fret)!.label"
            :x="fretX(fret)"
            :y="stringY(stringIndex) + 3"
            text-anchor="middle"
            class="fill-white text-[9px] font-medium pointer-events-none"
          >{{ highlightAt(stringIndex, fret)!.label }}</text>
        </g>
      </g>
    </g>
  </svg>
</template>
