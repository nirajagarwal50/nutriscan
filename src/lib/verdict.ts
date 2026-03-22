const GRADE_ORDER = ['a', 'b', 'c', 'd', 'e'] as const

export type VerdictKind = 'healthy' | 'moderate' | 'junk' | 'unknown'

export function normalizeNutriScoreGrade(
  product: { nutriscore_grade?: string; nutrition_grade_fr?: string; nutriscore_data?: { grade?: string } }
): string | undefined {
  const raw =
    product.nutriscore_grade ||
    product.nutrition_grade_fr ||
    product.nutriscore_data?.grade
  if (!raw) return undefined
  return String(raw).toLowerCase()
}

export function gradeToVerdict(grade: string | undefined): VerdictKind {
  const g = (grade || '').toLowerCase()
  if (g === 'a' || g === 'b') return 'healthy'
  if (g === 'c') return 'moderate'
  if (g === 'd' || g === 'e') return 'junk'
  return 'unknown'
}

export function verdictLabel(kind: VerdictKind): string {
  switch (kind) {
    case 'healthy':
      return 'Healthy'
    case 'moderate':
      return 'Moderate'
    case 'junk':
      return 'Junk'
    default:
      return 'Unknown'
  }
}

export function verdictEmoji(kind: VerdictKind): string {
  switch (kind) {
    case 'healthy':
      return '🟢'
    case 'moderate':
      return '🟡'
    case 'junk':
      return '🔴'
    default:
      return '⚪'
  }
}

function componentPoints(
  negative: { id: string; points?: number; points_max?: number }[] | undefined,
  id: string
): number | undefined {
  const c = negative?.find((x) => x.id === id)
  return c?.points
}

export function buildVerdictExplanation(args: {
  grade: string | undefined
  verdict: VerdictKind
  nutriscoreData?: {
    components?: {
      negative?: Array<{ id: string; points?: number; points_max?: number; value?: number | null }>
      positive?: Array<{ id: string; points?: number; points_max?: number; value?: number | null }>
    }
  }
  novaGroup?: number | string
  additivesTags?: string[]
}): { title: string; items: { text: string; tone: 'ok' | 'warn' | 'bad' }[] } {
  const title =
    args.verdict === 'junk'
      ? 'Why this is junk'
      : args.verdict === 'moderate'
        ? 'Why this is moderate'
        : args.verdict === 'healthy'
          ? 'Why this looks healthier'
          : 'Why we could not score this'

  const neg = args.nutriscoreData?.components?.negative
  const pos = args.nutriscoreData?.components?.positive

  const items: { text: string; tone: 'ok' | 'warn' | 'bad' }[] = []

  if (args.grade && GRADE_ORDER.includes(args.grade as (typeof GRADE_ORDER)[number])) {
    items.push({
      text: `NutriScore: ${args.grade.toUpperCase()}`,
      tone: args.verdict === 'healthy' ? 'ok' : args.verdict === 'junk' ? 'bad' : 'warn',
    })
  }

  const sugarPts = componentPoints(neg, 'sugars')
  if (sugarPts !== undefined && sugarPts >= 10) {
    items.push({ text: 'High sugar content', tone: 'bad' })
  } else if (sugarPts !== undefined && sugarPts >= 4) {
    items.push({ text: 'Elevated sugar content', tone: 'warn' })
  }

  const satFatPts = componentPoints(neg, 'saturated_fat')
  if (satFatPts !== undefined && satFatPts >= 8) {
    items.push({ text: 'High saturated fat', tone: 'bad' })
  } else if (satFatPts !== undefined && satFatPts >= 4) {
    items.push({ text: 'Notable saturated fat', tone: 'warn' })
  }

  const saltPts = componentPoints(neg, 'salt')
  if (saltPts !== undefined && saltPts >= 10) {
    items.push({ text: 'High salt content', tone: 'bad' })
  } else if (saltPts !== undefined && saltPts >= 4) {
    items.push({ text: 'Elevated salt', tone: 'warn' })
  }

  const energyPts = componentPoints(neg, 'energy')
  if (energyPts !== undefined && energyPts >= 7) {
    items.push({ text: 'High energy density (calories)', tone: 'warn' })
  }

  const fiber = pos?.find((p) => p.id === 'fiber')
  if (fiber?.points && fiber.points >= 2) {
    items.push({ text: 'Good fiber contribution', tone: 'ok' })
  }

  const fvl = pos?.find((p) => p.id === 'fruits_vegetables_legumes')
  if (fvl && (fvl.points ?? 0) >= 2) {
    items.push({ text: 'Fruit, vegetable, or legume content counted', tone: 'ok' })
  }

  const nova = Number(args.novaGroup)
  if (!Number.isNaN(nova)) {
    if (nova === 4) {
      items.push({ text: 'Ultra-processed (NOVA 4)', tone: 'bad' })
    } else if (nova === 3) {
      items.push({ text: 'Moderately processed (NOVA 3)', tone: 'warn' })
    } else if (nova === 1 || nova === 2) {
      items.push({ text: `Less processed (NOVA ${nova})`, tone: 'ok' })
    }
  }

  if ((args.additivesTags?.length ?? 0) >= 5) {
    items.push({ text: 'Many additives listed', tone: 'warn' })
  }

  if (!items.length) {
    if (!args.grade) {
      items.push({
        text: 'No NutriScore in Open Food Facts for this product yet. Verdict may change when data is added.',
        tone: 'warn',
      })
    } else {
      items.push({
        text: 'Based on NutriScore and available nutrition data from Open Food Facts.',
        tone: 'ok',
      })
    }
  }

  return { title, items }
}
