import { FIRST_NAME_POOL, LAST_NAME_POOL } from '../data/nameParts.js'

const MAX_NAME_PART_LENGTH = 5

export function getValidNameParts(pool) {
  return pool.filter((part) => part && [...part].length <= MAX_NAME_PART_LENGTH)
}

export function randomChoice(items, rng = Math.random) {
  return items[Math.floor(rng() * items.length)]
}

export function generateRandomUmaName(rng = Math.random) {
  const lastNames = getValidNameParts(LAST_NAME_POOL)
  const firstNames = getValidNameParts(FIRST_NAME_POOL)

  return {
    lastName: randomChoice(lastNames, rng),
    firstName: randomChoice(firstNames, rng),
  }
}
