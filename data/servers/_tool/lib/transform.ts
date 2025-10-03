import type { Instance, ServerInfo } from '../types'

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

export function determineRegion(domain: string): string {
  const tldToRegion: Record<string, string> = {
    dk: 'Europe',
    de: 'Europe',
    fr: 'Europe',
    uk: 'Europe',
    jp: 'Asia',
    cn: 'Asia',
    kr: 'Asia',
    au: 'Oceania',
    ca: 'North America',
    us: 'North America',
  }
  const tld = domain.split('.').pop()?.toLowerCase()
  return tldToRegion[tld || ''] || 'Unknown'
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
    total_users: instance.usage?.users?.active_month || 0,
    last_week_users: 0,
    approval_required: instance.registrations?.approval_required || false,
    language: primaryLanguage,
    category,
    title: generateTitleFromDomain(domain),
  }
}

