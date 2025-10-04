import type { Instance, ServerInfo } from '../types'

// Region slug type restricted to specific values
export type RegionSlug = 'europe' | 'north_america' | 'asia' | 'oceania'

export function displayRegion(region: RegionSlug | ''): string {
  if (!region) return ''
  return region
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
}

export function makeAbsoluteUrl(input: string, domain: string): string {
  try {
    return new URL(input).toString()
  } catch {}
  try {
    const base = new URL(`https://${domain}`)
    return new URL(input, base).toString()
  } catch (error) {
    console.warn(`Failed to convert URL for ${domain}: ${input}`, error)
    return input
  }
}

export function determineRegion(domain: string): RegionSlug | '' {
  // Map common ccTLDs to region slugs
  const tldToRegion: Record<string, RegionSlug> = {
    // Europe
    dk: 'europe', de: 'europe', fr: 'europe', uk: 'europe', gb: 'europe',
    ru: 'europe', it: 'europe', es: 'europe', nl: 'europe', se: 'europe',
    no: 'europe', fi: 'europe', pl: 'europe', cz: 'europe', be: 'europe',
    pt: 'europe', gr: 'europe', ie: 'europe', hr: 'europe', hu: 'europe',
    sk: 'europe', si: 'europe', ro: 'europe', bg: 'europe', at: 'europe',
    ch: 'europe', ee: 'europe', lv: 'europe', lt: 'europe',

    // Asia
    jp: 'asia', cn: 'asia', kr: 'asia', tw: 'asia', hk: 'asia',
    sg: 'asia', in: 'asia', id: 'asia', th: 'asia', vn: 'asia', my: 'asia',

    // Oceania
    au: 'oceania', nz: 'oceania',

    // North America
    ca: 'north_america', us: 'north_america', mx: 'north_america',
  }
  const tld = domain.split('.').pop()?.toLowerCase() || ''
  return tldToRegion[tld] || ''
}

export function generateTitleFromDomain(domain: string): string {
  try {
    const tlds = [
      'com',
      'org',
      'net',
      'edu',
      'gov',
      'mil',
      'int',
      'biz',
      'info',
      'name',
      'pro',
      'museum',
      'aero',
      'coop',
      'jobs',
      'mobi',
      'travel',
      'cat',
      'tel',
      'post',
      'social',
      'place',
      'app',
      'dev',
      'blog',
      'tech',
      'digital',
      'online',
      'website',
      'site',
      'club',
      'xyz',
      'tk',
      'ml',
      'ga',
      'cf',
      'space',
      'top',
      'work',
      'link',
      'dk',
      'de',
      'fr',
      'uk',
      'cn',
      'jp',
      'kr',
      'au',
      'ca',
      'us',
      'ru',
      'it',
      'es',
    ]

    let workingDomain = domain.toLowerCase()
    for (const tld of tlds) {
      if (workingDomain.endsWith(`.${tld}`)) {
        workingDomain = workingDomain.slice(0, -(tld.length + 1))
        break
      }
    }

    if (workingDomain === domain.toLowerCase()) {
      const lastDotIndex = workingDomain.lastIndexOf('.')
      if (lastDotIndex > 0) {
        workingDomain = workingDomain.slice(0, lastDotIndex)
      }
    }

    const parts = workingDomain.split('.').filter((part) => part.length > 0)
    const titleParts: string[] = []
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i]
      const capitalizedPart = capitalizePart(part)
      titleParts.push(capitalizedPart)
    }

    return titleParts.join(' ')
  } catch (error) {
    console.warn(`Failed to generate title for domain: ${domain}`, error)
    return domain
  }
}

export function capitalizePart(part: string): string {
  if (part.toLowerCase() === 'db') {
    return 'DB'
  }
  if (part.toLowerCase().endsWith('db')) {
    const prefix = part.slice(0, -2)
    const capitalizedPrefix = prefix.charAt(0).toUpperCase() + prefix.slice(1).toLowerCase()
    return capitalizedPrefix + 'DB'
  }
  return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
}

export function capitalizeDescription(description: string): string {
  if (!description || description.length === 0) {
    return description
  }
  return description.charAt(0).toUpperCase() + description.slice(1)
}

// Language display helpers
export function displayLanguage(code: string): string {
  if (!code) return ''
  const norm = code.toLowerCase().replace('_', '-')
  const map: Record<string, string> = {
    en: 'English',
    'en-us': 'English (US)',
    'en-gb': 'English (UK)',
    zh: 'Chinese',
    'zh-cn': 'Chinese (Simplified)',
    'zh-tw': 'Chinese (Traditional)',
    ja: 'Japanese',
    jp: 'Japanese',
    ko: 'Korean',
    kr: 'Korean',
    de: 'German',
    fr: 'French',
    es: 'Spanish',
    it: 'Italian',
    ru: 'Russian',
    pt: 'Portuguese',
    'pt-br': 'Portuguese (Brazil)',
    nl: 'Dutch',
    sv: 'Swedish',
    no: 'Norwegian',
    nb: 'Norwegian (Bokmål)',
    da: 'Danish',
    fi: 'Finnish',
    pl: 'Polish',
    cs: 'Czech',
    hu: 'Hungarian',
    he: 'Hebrew',
    iw: 'Hebrew',
    el: 'Greek',
    tr: 'Turkish',
    ar: 'Arabic',
    fa: 'Persian',
    ur: 'Urdu',
    hi: 'Hindi',
    id: 'Indonesian',
    vi: 'Vietnamese',
    th: 'Thai',
    uk: 'Ukrainian',
    ro: 'Romanian',
    bg: 'Bulgarian',
    sk: 'Slovak',
    sl: 'Slovenian',
    hr: 'Croatian',
    sr: 'Serbian',
  }
  if (map[norm]) return map[norm]
  const base = norm.split('-')[0]
  if (map[base]) return map[base]
  // Fallback: Title Case the code
  return norm
    .split('-')
    .map((p) => p ? p.charAt(0).toUpperCase() + p.slice(1) : p)
    .join('-')
}

export function displayLanguages(langs: string[] | undefined | null): string[] {
  if (!langs || langs.length === 0) return []
  return langs.map((l) => displayLanguage(l)).filter(Boolean)
}

export function mapInstanceToServerInfo(instance: Instance, domain: string): ServerInfo {
  const primaryLanguage = instance.languages?.[0] || 'en'
  const region = determineRegion(domain)
  const category = 'general'
  const categories = [category]

  let thumbnailUrl = instance.thumbnail?.url || ''
  if (thumbnailUrl) {
    thumbnailUrl = makeAbsoluteUrl(thumbnailUrl, domain)
  }

  return {
    domain: instance.domain || domain,
    version: instance.version || 'unknown',
    description: instance.description || '',
    languages: instance.languages || [primaryLanguage],
    region,
    categories,
    proxied_thumbnail: thumbnailUrl,
    blurhash: instance.thumbnail?.blurhash || '',
    icon: '',
    total_users: instance.usage?.users?.active_month || 0,
    last_week_users: 0,
    approval_required: instance.registrations?.approval_required || false,
    language: primaryLanguage,
    category,
    title: generateTitleFromDomain(domain),
  }
}
