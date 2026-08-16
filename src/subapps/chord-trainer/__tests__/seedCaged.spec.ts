import { beforeEach, describe, expect, it } from 'vitest'
import { CAGED_LIST, seedCagedListIfNeeded } from '../seedCaged'
import { deleteList, getList } from '../chordListsStore'

beforeEach(() => {
  localStorage.clear()
})

describe('seedCagedListIfNeeded', () => {
  it('seeds the CAGED list on first call', () => {
    expect(getList(CAGED_LIST.id)).toBeUndefined()
    seedCagedListIfNeeded()
    expect(getList(CAGED_LIST.id)).toEqual(CAGED_LIST)
  })

  it('does not resurrect the list after the user explicitly deletes it', () => {
    seedCagedListIfNeeded()
    deleteList(CAGED_LIST.id)
    seedCagedListIfNeeded() // called again, e.g. on a later app load
    expect(getList(CAGED_LIST.id)).toBeUndefined()
  })

  it('is a no-op on repeated calls once the flag is set', () => {
    seedCagedListIfNeeded()
    seedCagedListIfNeeded()
    seedCagedListIfNeeded()
    expect(getList(CAGED_LIST.id)).toEqual(CAGED_LIST)
  })
})
