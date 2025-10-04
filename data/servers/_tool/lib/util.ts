import type { ServerInfo } from '../types'
import { generateTitleFromDomain } from './transform'

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
    proxied_thumbnail: 'https://neodb.internal/placeholder',
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

export function sortByUsersDesc(list: ServerInfo[]): ServerInfo[] {
  return [...list].sort((a, b) => {
    const ua = a.total_users ?? 0
    const ub = b.total_users ?? 0
    if (ub !== ua) return ub - ua
    return a.domain.localeCompare(b.domain)
  })
}
