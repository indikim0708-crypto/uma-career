const OUTCOME_TYPES = ['GREAT_SUCCESS', 'SUCCESS', 'FAILURE']

export function validateElementaryCommonEvents(events) {
  const errors = []
  const ids = new Set()

  for (const event of events) {
    if (ids.has(event.id)) errors.push(`${event.id}: duplicate id`)
    ids.add(event.id)
    if (event.type !== 'COMMON') errors.push(`${event.id}: invalid type`)
    if (!Number.isInteger(event.minGrade) || !Number.isInteger(event.maxGrade) || event.minGrade < 1 || event.maxGrade > 6 || event.minGrade > event.maxGrade) {
      errors.push(`${event.id}: invalid grade range`)
    }
    if (event.choices.length !== 3) errors.push(`${event.id}: expected 3 choices`)

    for (const choice of event.choices) {
      const types = choice.outcomes.map(({ type }) => type)
      if (choice.outcomes.length !== 3 || !OUTCOME_TYPES.every((type) => types.includes(type))) {
        errors.push(`${event.id}/${choice.id}: invalid outcomes`)
      }
      if (choice.outcomes.reduce((sum, outcome) => sum + outcome.weight, 0) !== 100) {
        errors.push(`${event.id}/${choice.id}: invalid weight total`)
      }
    }
  }

  return errors
}
