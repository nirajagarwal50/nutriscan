export type BlogPost = {
  slug: string
  title: string
  description: string
  category: string
  image: string
  publishedAt: string
  readTimeMinutes: number
  content: string
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'understanding-nutriscore',
    title: 'Understanding NutriScore: How Ratings Are Calculated',
    description:
      'A practical overview of NutriScore: what the A–E scale measures, how negative and positive points work, and how to use it at the store.',
    category: 'Guide',
    image:
      'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&q=80',
    publishedAt: '2025-11-02',
    readTimeMinutes: 8,
    content: `
NutriScore is a front-of-pack label used in many countries to summarize the nutritional quality of foods and drinks at a glance. It ranks products from **A (better)** to **E (less favorable)** for a given category, so a yogurt is compared with other yogurts rather than with chocolate spread.

## What NutriScore looks at

The score is built from nutrients that public health guidance typically encourages people to limit, and from ingredients that are often associated with healthier patterns when present in meaningful amounts:

- **“Negative” points** usually reflect energy density, sugars, saturated fat, and salt.
- **“Positive” points** can reflect fiber, protein (when relevant to the category), and the share of fruits, vegetables, legumes, nuts, colza, walnut, and olive oils.

Open Food Facts exposes structured NutriScore data for many products, including the underlying points breakdown when available—this is what NutriScan uses to explain a verdict in plain language.

## How NutriScan maps NutriScore to a verdict

NutriScan intentionally keeps the decision simple:

- **A–B → Healthy**
- **C → Moderate**
- **D–E → Junk**

This is a consumer-friendly shorthand, not a medical prescription. Individual needs (allergies, medical diets, cultural foods) always come first.

## Limits to know

Some products have incomplete nutrition tables in the database, or no NutriScore yet. When that happens, NutriScan tells you clearly and still shows whatever nutrition facts exist.

## Sources

NutriScore methodology is published by Santé publique France and evolves over time. Open Food Facts computes or imports NutriScore grades for many products; always check the pack for the official label in your country.
`.trim(),
  },
  {
    slug: 'hidden-sugar-in-snacks',
    title: 'The Truth About Hidden Sugar in “Healthy” Snacks',
    description:
      'Marketing words like “natural” or “whole grain” do not guarantee low sugar. Here is how to spot sweeteners and compare products quickly.',
    category: 'Education',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA5HfjyH4_ce_j0RQntYaGmN0hTux1ghhYXkB3ERYwFG-3LhQ3We75beRokPt6VK69A8MSRv8BBgmzpH0GtWkMMgJs7dWZF6Z-5mRdprgqd0-mUEnCcXp7fLbRj6gQ_eBq3aIJXfzoL2exevkPMt36juHsyEbnNPg2GaUnlTj4ZR9uk2PEHjYzAglL-mK7GTIj4k7WRy9JyNpJ4YupdcicKdGv22SlpBvqkEheWqeTcrrg2CaT8HDfnn9LV-rpIweAZuMVUZ0eUI8C3',
    publishedAt: '2025-10-18',
    readTimeMinutes: 6,
    content: `
Sugar hides behind many names. On ingredient lists, look for words like **syrup**, **nectar**, **concentrate**, **malt**, **dextrose**, **fructose**, and many others—chemically they contribute sugars even when the front label looks “wholesome.”

## Why the nutrition table still matters

The **sugars** line (often shown “of which sugars” in Europe) tells you what ends up in the portion you eat, regardless of whether the sugar came from honey, fruit concentrate, or table sugar.

When Open Food Facts has structured nutrition data, NutriScan highlights sugar-related NutriScore drivers when they are strong enough to matter for the score.

## Practical shopping habits

- Compare **similar products** (same category) using NutriScore first, then read ingredients for details.
- Prefer shorter ingredient lists when two products are close—and you are not sensitive to any specific ingredient.
- Treat “healthy” branding as a hypothesis: **verify with data**.

## Disclaimer

This article is educational. It does not replace advice from a clinician or dietitian for medical nutrition therapy.
`.trim(),
  },
  {
    slug: 'nova-ultra-processed-foods',
    title: 'NOVA Groups: From Whole Foods to Ultra-Processed',
    description:
      'NOVA classifies foods by processing purpose, not just ingredient count. Learn what NOVA 1–4 means and how NutriScan surfaces it.',
    category: 'Science',
    image:
      'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&q=80',
    publishedAt: '2025-09-07',
    readTimeMinutes: 7,
    content: `
The **NOVA classification** groups foods by the extent and purpose of industrial processing:

- **Group 1 — Unprocessed or minimally processed foods**: fruit, vegetables, grains, meat, milk, eggs.
- **Group 2 — Processed culinary ingredients**: oils, sugar, salt used in cooking.
- **Group 3 — Processed foods**: mixes of groups 1 and 2 (bread, canned vegetables, cheese).
- **Group 4 — Ultra-processed foods**: formulations made mostly from industrial ingredients and additives, often ready-to-eat.

NOVA is not the same as NutriScore. A food can be ultra-processed yet have a mid NutriScore, depending on category and formulation—so NutriScan shows **both** when Open Food Facts provides them.

## How NutriScan uses NOVA

When \`nova_group\` is present in Open Food Facts, NutriScan explains processing in the product view and may mention ultra-processing in the verdict explanation when relevant.

## Limits

NOVA depends on ingredient lists and product type. Missing data means NutriScan cannot infer processing reliably—check the packaging when in doubt.
`.trim(),
  },
  {
    slug: 'using-open-food-facts-responsibly',
    title: 'Using Open Food Facts Data Responsibly in Apps',
    description:
      'What the Open Food Facts API is great at, where data gaps appear, and how NutriScan validates what you see.',
    category: 'Product',
    image:
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=1200&q=80',
    publishedAt: '2025-08-22',
    readTimeMinutes: 5,
    content: `
NutriScan reads public product data from **Open Food Facts**, a collaborative database improved continuously by contributors worldwide.

## Strengths

- Broad coverage across countries and categories.
- Frequently updated images, ingredients, nutrition tables, and computed scores.

## Common gaps

- Some regional products are missing or incomplete.
- NutriScore may be absent if nutrition facts are insufficient.
- Ingredients may be incomplete in older entries.

## What NutriScan does about it

- Shows a clear **not found** state when a barcode does not resolve.
- Surfaces **unknown** verdicts when NutriScore is missing, instead of guessing.
- Encourages manual search when scanning fails (camera permissions, glare, damaged barcodes).

## Contributing

If you want to improve the database, Open Food Facts welcomes contributions via their official apps and website.
`.trim(),
  },
]

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug)
}
