export const CHARACTER_PORTRAITS = Array.from({ length: 9 }, (_, index) => {
  const number = String(index + 1).padStart(2, '0')
  return { id: `portrait-${number}`, image: `/assets/portraits/portrait-${number}.png` }
})

export function getCharacterPortrait(portraitId) {
  return CHARACTER_PORTRAITS.find(({ id }) => id === portraitId) ?? null
}
