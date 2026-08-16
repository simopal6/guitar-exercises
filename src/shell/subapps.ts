import type { Component } from 'vue'

/**
 * A sub-app is fully described here: adding a future one (ear-training,
 * fretboard note-finder) is just a new entry, lazy-loaded via dynamic import.
 */
export interface SubAppDefinition {
  id: string
  title: string
  path: string
  icon?: string
  component: () => Promise<Component>
}

export const subApps: SubAppDefinition[] = [
  {
    id: 'interval-trainer',
    title: 'Intervalli',
    path: '/intervals',
    icon: '🎵',
    component: () => import('../subapps/interval-trainer/IntervalTrainerView.vue'),
  },
  {
    id: 'chord-trainer',
    title: 'Accordi',
    path: '/chords',
    icon: '🎸',
    component: () => import('../subapps/chord-trainer/ChordTrainerView.vue'),
  },
]
