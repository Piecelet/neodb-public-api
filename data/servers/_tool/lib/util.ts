import type { ServerInfo } from '../types'
import { generateTitleFromDomain } from './transform'

const PLACEHOLDER_THUMBNAIL = 'https://neodb.internal/placeholder'

export function createPlaceholderServerInfo(domain: string): ServerInfo {
  return {
    domain,
    version: 'Unknown',
    title: generateTitleFromDomain(domain),
    description: '',
    languages: ['Unknown'],
    display_languages: [],
    region: 'Unknown',
    display_region: '',
    categories: ['Unknown'],
    proxied_thumbnail: PLACEHOLDER_THUMBNAIL,
    blurhash: '',
    icon: '',
    total_users: 0,
    last_week_users: 0,
    approval_required: false,
    language: 'Unknown',
    display_language: '',
    category: 'Unknown',
  }
}

function isMeaningfulString(value: string | undefined): value is string {
  return Boolean(value && value.trim() && value !== 'Unknown' && value !== 'unknown')
}

function mergeUniqueStrings(...groups: Array<string[] | undefined>): string[] {
  const values = groups.flatMap((group) => group ?? []).filter(isMeaningfulString)
  return Array.from(new Set(values))
}

function choosePreferred(baseValue: string | undefined, incomingValue: string | undefined): string | undefined {
  return isMeaningfulString(baseValue) ? baseValue : incomingValue
}

function scoreServerInfo(item: ServerInfo): number {
  let score = 0
  if (isMeaningfulString(item.version)) score += 2
  if (isMeaningfulString(item.description)) score += 2
  if (isMeaningfulString(item.title)) score += 1
  if (isMeaningfulString(item.icon)) score += 1
  if (isMeaningfulString(item.logo)) score += 1
  if (isMeaningfulString(item.proxied_thumbnail) && item.proxied_thumbnail !== PLACEHOLDER_THUMBNAIL) score += 1
  if ((item.total_users ?? 0) > 0) score += 2
  if (mergeUniqueStrings(item.languages).length > 0) score += 1
  return score
}

function mergeServerInfoGroup(items: ServerInfo[]): ServerInfo {
  if (items.length === 1) return items[0]

  const sorted = [...items].sort((a, b) => {
    const scoreDiff = scoreServerInfo(b) - scoreServerInfo(a)
    if (scoreDiff !== 0) return scoreDiff
    const usersDiff = (b.total_users ?? 0) - (a.total_users ?? 0)
    if (usersDiff !== 0) return usersDiff
    return a.domain.localeCompare(b.domain)
  })

  const base = { ...sorted[0] }
  for (const item of sorted.slice(1)) {
    base.version = choosePreferred(base.version, item.version) ?? ''
    base.title = choosePreferred(base.title, item.title) ?? base.title
    base.description = choosePreferred(base.description, item.description) ?? base.description
    base.region = choosePreferred(base.region, item.region) ?? ''
    base.display_region = choosePreferred(base.display_region, item.display_region)
    base.proxied_thumbnail = choosePreferred(base.proxied_thumbnail, item.proxied_thumbnail) ?? ''
    base.blurhash = choosePreferred(base.blurhash, item.blurhash) ?? ''
    base.icon = choosePreferred(base.icon, item.icon)
    base.logo = choosePreferred(base.logo, item.logo)
    base.language = choosePreferred(base.language, item.language) ?? ''
    base.display_language = choosePreferred(base.display_language, item.display_language)
    base.category = choosePreferred(base.category, item.category) ?? ''
    base.total_users = Math.max(base.total_users ?? 0, item.total_users ?? 0)
    base.last_week_users = Math.max(base.last_week_users ?? 0, item.last_week_users ?? 0)
    base.approval_required = base.approval_required || item.approval_required
    base.languages = mergeUniqueStrings(base.languages, item.languages)
    base.display_languages = mergeUniqueStrings(base.display_languages, item.display_languages)
    base.categories = mergeUniqueStrings(base.categories, item.categories)
  }

  return base
}

export function dedupeServerInfosByDomain(list: ServerInfo[]): ServerInfo[] {
  const grouped = new Map<string, ServerInfo[]>()

  for (const item of list) {
    const domain = item.domain.trim().toLowerCase()
    if (!grouped.has(domain)) grouped.set(domain, [])
    grouped.get(domain)!.push({ ...item, domain })
  }

  return Array.from(grouped.values()).map((items) => mergeServerInfoGroup(items))
}

export function sortByUsersDesc(list: ServerInfo[]): ServerInfo[] {
  return [...list].sort((a, b) => {
    const ua = a.total_users ?? 0
    const ub = b.total_users ?? 0
    if (ub !== ua) return ub - ua
    return a.domain.localeCompare(b.domain)
  })
}
