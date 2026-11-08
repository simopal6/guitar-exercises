import type { Component } from 'vue'

/**
 * A sub-app is fully described here: adding a future one (ear-training,
 * fretboard note-finder) is just a new entry, lazy-loaded via dynamic import.
 * Order matters: it's the order of the tiles on the home page.
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
    id: 'chord-trainer',
    title: 'Accordi',
    path: '/chords',
    icon: '🎸',
    component: () => import('../subapps/chord-trainer/ChordTrainerView.vue'),
  },
  {
    id: 'scale-trainer',
    title: 'Scale',
    path: '/scales',
    icon: '🪜',
    component: () => import('../subapps/scale-trainer/ScaleTrainerView.vue'),
  },
  {
    id: 'interval-trainer',
    title: 'Intervalli',
    path: '/intervals',
    icon: '🎵',
    component: () => import('../subapps/interval-trainer/IntervalTrainerView.vue'),
  },
  {
    id: 'mode-improv',
    title: 'Modi',
    path: '/modes',
    icon: '🎼',
    component: () => import('../subapps/mode-improv/ModeImprovView.vue'),
  },
  {
    id: 'song-trainer',
    title: 'Canzoni',
    path: '/songs',
    icon: '🎶',
    component: () => import('../subapps/song-trainer/SongTrainerView.vue'),
  },
]
