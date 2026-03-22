export function describeNova(
  group: number | string | undefined
): { level: string; title: string; description: string } | null {
  const n = typeof group === 'string' ? Number(group) : group
  if (n === undefined || n === null || Number.isNaN(Number(n))) return null
  const g = Number(n)
  if (g === 1) {
    return {
      level: '1',
      title: 'Unprocessed or minimally processed',
      description: 'Whole foods or mild processes like cleaning, freezing, pasteurizing without adding industrial ingredients.',
    }
  }
  if (g === 2) {
    return {
      level: '2',
      title: 'Processed culinary ingredients',
      description: 'Oils, sugar, salt, and similar ingredients typically used with group 1 foods in cooking.',
    }
  }
  if (g === 3) {
    return {
      level: '3',
      title: 'Processed foods',
      description: 'Industrial food products with added fats, salt, or sugar—often recognizable recipes with few ingredients.',
    }
  }
  if (g === 4) {
    return {
      level: '4',
      title: 'Ultra-processed',
      description: 'Formulations made mostly from industrial ingredients and additives; often ready-to-eat.',
    }
  }
  return null
}
