import type { Instance } from '../types'
import { extractMetaDescription, extractIconHref, extractHomepageLogo } from './parse'

// Cache homepage HTML by domain to reuse across description/icon/logo fetches
const homepageHtmlCache = new Map<string, Promise<string>>()

export async function fetchHomepageDescription(domain: string): Promise<string> {
  try {
    // Use cached homepage HTML if available
    const cached = homepageHtmlCache.get(domain)
    if (cached) {
      const html = await cached
      const description = extractMetaDescription(html)
      if (description) {
        console.log(`  ✓ Found description from homepage: "${description.substring(0, 50)}..."`)
        return description
      }
      console.log(`  ✗ No description found in homepage meta tags`)
      return ''
    }

    const base = new URL(`https://${domain}`)
    const homeUrl = new URL('/', base)
    console.log(`  Fetching homepage description: ${homeUrl.toString()}`)

    const response = await fetch(homeUrl.toString(), {
      headers: {
        'User-Agent': 'NeoDB-Instance-Fetcher/1.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()
    // store in cache for reuse
    homepageHtmlCache.set(domain, Promise.resolve(html))
    const description = extractMetaDescription(html)

    if (description) {
      console.log(`  ✓ Found description from homepage: "${description.substring(0, 50)}..."`)
      return description
    } else {
      console.log(`  ✗ No description found in homepage meta tags`)
      return ''
    }
  } catch (error) {
    console.warn(`  ✗ Failed to fetch homepage description for ${domain}:`, error)
    return ''
  }
}

export async function fetchInstanceInfo(domain: string): Promise<Instance | null> {
  try {
    const apiUrl = new URL('/api/v2/instance', `https://${domain}`)
    console.log(`Fetching: ${apiUrl.toString()}`)

    const response = await fetch(apiUrl.toString(), {
      headers: {
        'User-Agent': 'NeoDB-Instance-Fetcher/1.0',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = (await response.json()) as Instance
    console.log(`✓ Successfully fetched info for ${domain}`)
    return data
  } catch (error) {
    console.error(`✗ Failed to fetch info for ${domain}:`, error)
    return null
  }
}

export async function fetchHomepageIcon(domain: string): Promise<string> {
  try {
    // Use cached homepage HTML if available
    const cached = homepageHtmlCache.get(domain)
    if (cached) {
      const html = await cached
      const href = extractIconHref(html)
      if (href) {
        console.log(`  ✓ Found icon href in homepage`)
        return href
      }
      console.log(`  ✗ No <link rel=icon> found`)
      return ''
    }

    const base = new URL(`https://${domain}`)
    const homeUrl = new URL('/', base)
    console.log(`  Fetching homepage for icon: ${homeUrl.toString()}`)

    const response = await fetch(homeUrl.toString(), {
      headers: {
        'User-Agent': 'NeoDB-Instance-Fetcher/1.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()
    // store in cache for reuse
    homepageHtmlCache.set(domain, Promise.resolve(html))
    const href = extractIconHref(html)
    if (href) {
      console.log(`  ✓ Found icon href in homepage`)
      return href
    }
    console.log(`  ✗ No <link rel=icon> found`)
    return ''
  } catch (error) {
    console.warn(`  ✗ Failed to fetch homepage icon for ${domain}:`, error)
    return ''
  }
}

export async function fetchHomepageLogo(domain: string): Promise<string> {
  try {
    // Use cached homepage HTML if available
    const cached = homepageHtmlCache.get(domain)
    if (cached) {
      const html = await cached
      const src = extractHomepageLogo(html)
      if (src) {
        console.log(`  ✓ Found homepage logo <img>`)
        return src
      }
      console.log(`  ✗ No homepage logo found`)
      return ''
    }

    const base = new URL(`https://${domain}`)
    const homeUrl = new URL('/', base)
    console.log(`  Fetching homepage for logo: ${homeUrl.toString()}`)

    const response = await fetch(homeUrl.toString(), {
      headers: {
        'User-Agent': 'NeoDB-Instance-Fetcher/1.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()
    // store in cache for reuse
    homepageHtmlCache.set(domain, Promise.resolve(html))
    const src = extractHomepageLogo(html)
    if (src) {
      console.log(`  ✓ Found homepage logo <img>`)
      return src
    }
    console.log(`  ✗ No homepage logo found`)
    return ''
  } catch (error) {
    console.warn(`  ✗ Failed to fetch homepage logo for ${domain}:`, error)
    return ''
  }
}
