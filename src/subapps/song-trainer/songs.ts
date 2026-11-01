export interface Song {
  id: string
  title: string
  artist?: string
}

// Ids must stay stable: progress is saved by song id, so renaming a title is
// safe but changing an id resets that bookmark to the first song.
export const SONGS: Song[] = [
  { id: 'take-me-out', title: 'Take Me Out', artist: 'Franz Ferdinand' },
  { id: 'charlie-fa-surf', title: 'Charlie Fa Surf', artist: 'Baustelle' },
  { id: 'holiday', title: 'Holiday', artist: 'Green Day' },
  { id: 'zombie', title: 'Zombie', artist: 'The Cranberries' },
  { id: 'starlight', title: 'Starlight', artist: 'Muse' },
  { id: 'blunderbuss', title: 'Blunderbuss', artist: 'Jack White' },
  { id: 'have-you-ever-seen-the-rain', title: 'Have You Ever Seen The Rain', artist: 'Creedence Clearwater Revival' },
  { id: 'gli-anni', title: 'Gli Anni', artist: '883' },
]
