import type { Instance, ServerInfo } from '../types'
import { readFileSync } from 'fs'

export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url.trim())
    return urlObj.hostname
  } catch (error) {
    console.error(`Invalid URL: ${url}`, error)
    return ''
  }
}

export function extractMetaDescription(html: string): string {
  const cleanHtml = html.replace(/\s+/g, ' ')
  const metaTagRegex = /<meta\s+[^>]*(?:name=["']description["']|property=["']og:description["'])[^>]*content=["']([^"']*?)["'][^>]*>/gi

  let match: RegExpExecArray | null
  const results: string[] = []

  while ((match = metaTagRegex.exec(cleanHtml)) !== null) {
    const content = match[1]
    if (content && content.trim()) {
      results.push(content.trim())
    }
  }

  const reversedMetaTagRegex = /<meta\s+[^>]*content=["']([^"']*?)["'][^>]*(?:name=["']description["']|property=["']og:description["'])[^>]*>/gi

  while ((match = reversedMetaTagRegex.exec(cleanHtml)) !== null) {
    const content = match[1]
    if (content && content.trim()) {
      results.push(content.trim())
    }
  }

  return results.length > 0 ? results[0] : ''
}

export function readServerUrls(filePath: string): string[] {
  const raw = readFileSync(filePath, 'utf-8')
  const urls: string[] = []

  const stripComment = (s: string): string => {
    const iHash = s.indexOf('#')
    const iSemi = s.indexOf(';')
    let cut = -1
    if (iHash !== -1) cut = iHash
    if (iSemi !== -1) cut = cut === -1 ? iSemi : Math.min(cut, iSemi)
    return cut === -1 ? s : s.slice(0, cut)
  }

  for (const line of raw.split('\n')) {
    const stripped = stripComment(line).trim()
    if (!stripped) continue
    const parts = stripped
      .split(/(?=https?:\/\/)/g)
      .map((p) => p.trim())
      .filter(Boolean)
    for (const p of parts) {
      try {
        // eslint-disable-next-line no-new
        new URL(p)
        urls.push(p)
      } catch {
        console.warn(`Skipping invalid URL segment: ${p}`)
      }
    }
  }
  return urls
}

export function extractIconHref(html: string): string {
  const cleanHtml = html.replace(/\s+/g, ' ')

  // Match <link ... rel="...icon..." ... href="...">
  const relFirst = /<link\s+[^>]*rel=["'][^"']*icon[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>/i
  const hrefFirst = /<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["'][^"']*icon[^"']*["'][^>]*>/i

  const m1 = relFirst.exec(cleanHtml)
  if (m1 && m1[1]) return m1[1].trim()
  const m2 = hrefFirst.exec(cleanHtml)
  if (m2 && m2[1]) return m2[1].trim()
  return ''
}

export function extractHomepageLogo(html: string): string {
  const s = html.replace(/\s+/g, ' ')
  // Find container with class containing nav-logo, then the first <img src="...">
  const containerRe = /<([a-z0-9]+)\s+[^>]*class=["'][^"']*\bnav-logo\b[^"']*["'][^>]*>([\s\S]*?)<\/\1>/i
  const match = containerRe.exec(s)
  if (match) {
    const inner = match[2] || ''
    const imgRe = /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/i
    const im = imgRe.exec(inner)
    if (im && im[1]) return im[1].trim()
  }
  // Fallback: any <img> with id/class containing logo
  const anyLogoImg = /<img\s+[^>]*(?:id|class)=["'][^"']*\blogo\b[^"']*["'][^>]*src=["']([^"']+)["'][^>]*>/i
  const m2 = anyLogoImg.exec(s)
  if (m2 && m2[1]) return m2[1].trim()
  return ''
}
