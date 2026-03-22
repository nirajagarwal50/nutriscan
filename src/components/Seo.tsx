import { Helmet } from 'react-helmet-async'
import { absoluteUrl } from '../lib/site'

type SeoProps = {
  title: string
  description: string
  path?: string
  image?: string
  type?: 'website' | 'article'
  jsonLd?: Record<string, unknown>
  noIndex?: boolean
}

export function Seo({
  title,
  description,
  path = '/',
  image,
  type = 'website',
  jsonLd,
  noIndex,
}: SeoProps) {
  const url = absoluteUrl(path)
  const ogImage = image || absoluteUrl('/og-default.svg')
  const fullTitle = title.includes('NutriScan') ? title : `${title} | NutriScan`

  return (
    <Helmet prioritizeSeoTags>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noIndex ? <meta name="robots" content="noindex,nofollow" /> : null}

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="NutriScan" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {jsonLd ? (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      ) : null}
    </Helmet>
  )
}
