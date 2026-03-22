const MAP: Record<string, { label: string; icon: string }> = {
  'en:vegetarian': { label: 'Vegetarian', icon: 'eco' },
  'en:vegan': { label: 'Vegan', icon: 'compost' },
  'en:organic': { label: 'Organic', icon: 'verified' },
  'en:eu-organic': { label: 'EU Organic', icon: 'verified' },
  'en:fair-trade': { label: 'Fair trade', icon: 'handshake' },
  'en:palm-oil-free': { label: 'Palm oil free', icon: 'forest' },
  'en:no-gluten': { label: 'Gluten free', icon: 'no_meals' },
  'en:gluten-free': { label: 'Gluten free', icon: 'no_meals' },
  'en:halal': { label: 'Halal', icon: 'mosque' },
  'en:kosher': { label: 'Kosher', icon: 'star' },
}

export type LabelChip = { key: string; label: string; icon: string; active: boolean }

export function chipsFromLabelsTags(tags: string[] | undefined): LabelChip[] {
  if (!tags?.length) return []
  return tags.slice(0, 12).map((tag) => {
    const m = MAP[tag]
    if (m) return { key: tag, label: m.label, icon: m.icon, active: true }
    const short = tag.replace(/^..:/, '').replace(/-/g, ' ')
    return { key: tag, label: titleCase(short), icon: 'label', active: false }
  })
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase())
}
