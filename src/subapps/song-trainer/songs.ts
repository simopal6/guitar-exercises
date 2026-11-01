export interface Song {
  id: string
  title: string
  artist?: string
}

// Placeholder repertoire, to be replaced with the real one. Ids must stay
// stable: progress is saved by song id, so renaming a title is safe but
// changing an id resets that bookmark to the first song.
export const SONGS: Song[] = [
  { id: 'canzone-1', title: 'Canzone 1' },
  { id: 'canzone-2', title: 'Canzone 2' },
  { id: 'canzone-3', title: 'Canzone 3' },
  { id: 'canzone-4', title: 'Canzone 4' },
  { id: 'canzone-5', title: 'Canzone 5' },
  { id: 'canzone-6', title: 'Canzone 6' },
  { id: 'canzone-7', title: 'Canzone 7' },
  { id: 'canzone-8', title: 'Canzone 8' },
]
