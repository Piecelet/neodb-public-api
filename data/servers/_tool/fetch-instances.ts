#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { Instance } from './Instance';
import type { ServerInfo } from './ServerInfo';

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url.trim());
    return urlObj.hostname;
  } catch (error) {
    console.error(`Invalid URL: ${url}`, error);
    return '';
  }
}

/**
 * Fetch meta description from homepage
 */
async function fetchHomepageDescription(domain: string): Promise<string> {
  try {
    const base = new URL(`https://${domain}`);
    const homeUrl = new URL('/', base);
    console.log(`  Fetching homepage description: ${homeUrl.toString()}`);
    
    const response = await fetch(homeUrl.toString(), {
      headers: {
        'User-Agent': 'NeoDB-Instance-Fetcher/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      // Allow redirects and set timeout
      redirect: 'follow',
      signal: AbortSignal.timeout(10000), // 10 seconds timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    
    // Extract meta description or og:description
    const description = extractMetaDescription(html);
    
    if (description) {
      console.log(`  ✓ Found description from homepage: "${description.substring(0, 50)}..."`);
      return description;
    } else {
      console.log(`  ✗ No description found in homepage meta tags`);
      return '';
    }
  } catch (error) {
    console.warn(`  ✗ Failed to fetch homepage description for ${domain}:`, error);
    return '';
  }
}

/**
 * Extract meta description from HTML content
 */
function extractMetaDescription(html: string): string {
  // Remove newlines and extra spaces from HTML for easier regex matching
  const cleanHtml = html.replace(/\s+/g, ' ');
  
  // Look for meta tags that contain either name="description" or property="og:description"
  // This pattern is more flexible and handles various attribute orders and combinations
  const metaTagRegex = /<meta\s+[^>]*(?:name=["']description["']|property=["']og:description["'])[^>]*content=["']([^"']*?)["'][^>]*>/gi;
  
  let match;
  const results: string[] = [];
  
  // Find all matching meta tags
  while ((match = metaTagRegex.exec(cleanHtml)) !== null) {
    const content = match[1];
    if (content && content.trim()) {
      results.push(content.trim());
    }
  }
  
  // Also try reversed pattern (content comes before name/property)
  const reversedMetaTagRegex = /<meta\s+[^>]*content=["']([^"']*?)["'][^>]*(?:name=["']description["']|property=["']og:description["'])[^>]*>/gi;
  
  while ((match = reversedMetaTagRegex.exec(cleanHtml)) !== null) {
    const content = match[1];
    if (content && content.trim()) {
      results.push(content.trim());
    }
  }
  
  // Return the first non-empty result
  return results.length > 0 ? results[0] : '';
}

/**
 * Fetch instance information from Mastodon API
 */
async function fetchInstanceInfo(domain: string): Promise<Instance | null> {
  try {
    const apiUrl = new URL('/api/v2/instance', `https://${domain}`);
    console.log(`Fetching: ${apiUrl.toString()}`);
    
    const response = await fetch(apiUrl.toString(), {
      headers: {
        'User-Agent': 'NeoDB-Instance-Fetcher/1.0',
        'Accept': 'application/json',
      },
      // Set timeout
      signal: AbortSignal.timeout(10000), // 10 seconds timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json() as Instance;
    console.log(`✓ Successfully fetched info for ${domain}`);
    return data;
  } catch (error) {
    console.error(`✗ Failed to fetch info for ${domain}:`, error);
    return null;
  }
}

/**
 * Map Instance data to ServerInfo schema
 */
function mapInstanceToServerInfo(instance: Instance, domain: string): ServerInfo {
  // Extract primary language from languages array
  const primaryLanguage = instance.languages?.[0] || 'en';
  
  // Determine region based on domain or use 'unknown'
  const region = determineRegion(domain);
  
  // Set default category
  const category = 'general';
  const categories = [category];
  
  // Handle thumbnail URL - convert relative paths to absolute URLs
  let thumbnailUrl = instance.thumbnail?.url || '';
  if (thumbnailUrl) {
    thumbnailUrl = makeAbsoluteUrl(thumbnailUrl, domain);
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
    last_week_users: 0, // This data is not available in the v2 API
    approval_required: instance.registrations?.approval_required || false,
    language: primaryLanguage,
    category,
    title: generateTitleFromDomain(domain),
  };
}

/**
 * Convert relative URL to absolute URL
 */
function makeAbsoluteUrl(input: string, domain: string): string {
  try {
    // If input is already an absolute URL, return its normalized string
    return new URL(input).toString();
  } catch {}

  try {
    const base = new URL(`https://${domain}`);
    return new URL(input, base).toString();
  } catch (error) {
    console.warn(`Failed to convert URL for ${domain}: ${input}`, error);
    return input;
  }
}

/**
 * Generate title from domain name
 */
function generateTitleFromDomain(domain: string): string {
  try {
    // Known TLDs to remove
    const tlds = [
      'com', 'org', 'net', 'edu', 'gov', 'mil', 'int', 'biz', 'info', 'name', 'pro',
      'museum', 'aero', 'coop', 'jobs', 'mobi', 'travel', 'cat', 'tel', 'post',
      'social', 'place', 'app', 'dev', 'blog', 'tech', 'digital', 'online', 'website',
      'site', 'club', 'xyz', 'tk', 'ml', 'ga', 'cf', 'space', 'top', 'work', 'link',
      // Country codes
      'dk', 'de', 'fr', 'uk', 'cn', 'jp', 'kr', 'au', 'ca', 'us', 'ru', 'it', 'es'
    ];
    
    // Remove TLD
    let workingDomain = domain.toLowerCase();
    for (const tld of tlds) {
      if (workingDomain.endsWith(`.${tld}`)) {
        workingDomain = workingDomain.slice(0, -(tld.length + 1));
        break;
      }
    }
    
    // If no TLD was removed, try to remove the last part after the last dot
    if (workingDomain === domain.toLowerCase()) {
      const lastDotIndex = workingDomain.lastIndexOf('.');
      if (lastDotIndex > 0) {
        workingDomain = workingDomain.slice(0, lastDotIndex);
      }
    }
    
    // Split by dots and process from right to left
    const parts = workingDomain.split('.').filter(part => part.length > 0);
    const titleParts: string[] = [];
    
    // Process each part from right to left
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i];
      const capitalizedPart = capitalizePart(part);
      titleParts.push(capitalizedPart); // Add in extraction order (right to left)
    }
    
    return titleParts.join(' ');
  } catch (error) {
    console.warn(`Failed to generate title for domain: ${domain}`, error);
    return domain; // Fallback to domain name
  }
}

/**
 * Capitalize a domain part with special DB handling
 */
function capitalizePart(part: string): string {
  // Handle special case: if the part is exactly "db" or ends with "db"
  if (part.toLowerCase() === 'db') {
    return 'DB';
  }
  
  // Check if ends with "db"
  if (part.toLowerCase().endsWith('db')) {
    const prefix = part.slice(0, -2);
    const capitalizedPrefix = prefix.charAt(0).toUpperCase() + prefix.slice(1).toLowerCase();
    return capitalizedPrefix + 'DB';
  }
  
  // Regular capitalization
  return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
}

/**
 * Capitalize first letter of description only
 */
function capitalizeDescription(description: string): string {
  if (!description || description.length === 0) {
    return description;
  }
  
  return description.charAt(0).toUpperCase() + description.slice(1);
}

/**
 * Create placeholder ServerInfo for failed servers
 */
function createPlaceholderServerInfo(domain: string): ServerInfo {
  return {
    domain,
    version: 'Unknown',
    title: generateTitleFromDomain(domain),
    description: '',
    languages: ['Unknown'],
    region: 'Unknown',
    categories: ['Unknown'],
    proxied_thumbnail: 'https://neodb.internal/placeholder',
    blurhash: '',
    total_users: 0,
    last_week_users: 0,
    approval_required: false,
    language: 'Unknown',
    category: 'Unknown',
  };
}

/**
 * Determine region based on domain (simple heuristic)
 */
function determineRegion(domain: string): string {
  const tldToRegion: Record<string, string> = {
    'dk': 'Europe',
    'de': 'Europe',
    'fr': 'Europe',
    'uk': 'Europe',
    'jp': 'Asia',
    'cn': 'Asia',
    'kr': 'Asia',
    'au': 'Oceania',
    'ca': 'North America',
    'us': 'North America',
  };

  const tld = domain.split('.').pop()?.toLowerCase();
  return tldToRegion[tld || ''] || 'Unknown';
}

/** Parse URLs from a text file. Supports multiple URLs on a line. */
function readServerUrls(filePath: string): string[] {
  const raw = readFileSync(filePath, 'utf-8');
  const urls: string[] = [];

  const stripComment = (s: string): string => {
    const iHash = s.indexOf('#');
    const iSemi = s.indexOf(';');
    let cut = -1;
    if (iHash !== -1) cut = iHash;
    if (iSemi !== -1) cut = cut === -1 ? iSemi : Math.min(cut, iSemi);
    return cut === -1 ? s : s.slice(0, cut);
  };

  for (const line of raw.split('\n')) {
    const stripped = stripComment(line).trim();
    if (!stripped) continue;
    // If a line accidentally concatenates multiple URLs, split on each http(s) occurrence
    const parts = stripped
      .split(/(?=https?:\/\/)/g)
      .map((p) => p.trim())
      .filter(Boolean);
    for (const p of parts) {
      try {
        // Validate URL
        // eslint-disable-next-line no-new
        new URL(p);
        urls.push(p);
      } catch {
        console.warn(`Skipping invalid URL segment: ${p}`);
      }
    }
  }
  return urls;
}

/** Simple sleep helper */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Process a list of server URLs concurrently into ServerInfo objects. */
async function processServerList(urls: string[], concurrency = 6): Promise<ServerInfo[]> {
  const results: ServerInfo[] = [];
  let index = 0;

  // Worker function: fetch and map one domain at a time
  const worker = async (id: number) => {
    while (true) {
      const current = index++;
      if (current >= urls.length) break;

      const url = urls[current];
      const domain = extractDomain(url);
      if (!domain) {
        console.warn(`[w${id}] Skipping invalid URL: ${url}`);
        continue;
      }

      console.log(`\n[w${id}] Processing ${current + 1}/${urls.length}: ${domain}`);
      const instanceData = await fetchInstanceInfo(domain);

      if (instanceData) {
        // Ensure description present, fallback to homepage
        let description = instanceData.description || '';
        if (!description.trim()) {
          console.log(`[w${id}]   API description is empty, fetching from homepage...`);
          description = await fetchHomepageDescription(domain);
        }
        description = capitalizeDescription(description);

        const enhanced = { ...instanceData, description };
        const info = mapInstanceToServerInfo(enhanced, domain);
        results.push(info);
        console.log(`[w${id}] ✓ Processed ${domain} successfully`);
      } else {
        console.log(`[w${id}]   API failed, attempting to fetch description from homepage...`);
        let homepageDescription = await fetchHomepageDescription(domain);
        homepageDescription = capitalizeDescription(homepageDescription);
        const placeholder = createPlaceholderServerInfo(domain);
        placeholder.description = homepageDescription;
        results.push(placeholder);
        console.warn(`[w${id}] ✗ Created placeholder for ${domain} due to errors`);
      }

      // Gentle jitter to avoid spiky bursts against the same origin
      await sleep(Math.floor(Math.random() * 250));
    }
  };

  const workers = Array.from({ length: Math.max(1, concurrency) }, (_, i) => worker(i + 1));
  await Promise.all(workers);
  return results;
}

/** Sort servers by total_users desc, tie-break by domain asc. */
function sortByUsersDesc(list: ServerInfo[]): ServerInfo[] {
  return [...list].sort((a, b) => {
    const ua = a.total_users ?? 0;
    const ub = b.total_users ?? 0;
    if (ub !== ua) return ub - ua;
    return a.domain.localeCompare(b.domain);
  });
}

/**
 * Main function to process official and community servers separately, sort, then merge.
 */
async function main() {
  try {
    const base = join(process.cwd(), 'data', 'servers');
    const officialPath = join(base, '_source', 'servers-official.txt');
    const communityPath = join(base, '_source', 'servers.txt');

    const officialUrls = readServerUrls(officialPath);
    const communityUrls = readServerUrls(communityPath);

    console.log(`Found ${officialUrls.length} official servers, ${communityUrls.length} community servers.`);

    // Concurrency from env or default 6
    const concurrency = Number.parseInt(process.env.CONCURRENCY ?? '6', 10) || 6;
    console.log(`Using concurrency: ${concurrency}`);

    // Build sets of domains and a combined unique list for single-pool fetching
    const officialDomainsArr = officialUrls.map((u) => extractDomain(u)).filter(Boolean) as string[];
    const communityDomainsArr = communityUrls.map((u) => extractDomain(u)).filter(Boolean) as string[];
    const officialDomains = new Set(officialDomainsArr);
    const communityDomains = new Set(communityDomainsArr);

    const combinedDomains = Array.from(new Set<string>([...officialDomains, ...communityDomains]));
    const combinedUrls = combinedDomains.map((d) => `https://${d}/`);

    console.log(`\n== Processing ALL servers in a single pool ==`);
    const combinedResults = await processServerList(combinedUrls, concurrency);

    // Split results back into groups
    const officialResults = combinedResults.filter((s) => officialDomains.has(s.domain));
    const communityResults = combinedResults.filter((s) => communityDomains.has(s.domain) && !officialDomains.has(s.domain));

    // Sort each group by users desc
    const officialSorted = sortByUsersDesc(officialResults);
    const communitySorted = sortByUsersDesc(communityResults);

    // Merge: official first, then community
    const allResults = [...officialSorted, ...communitySorted];

    // Write results
    const outputPath = join(base, 'servers.json');
    const outputOfficialPath = join(base, 'servers-official.json');
    const outputCommunityPath = join(base, 'servers-community.json');
    writeFileSync(outputPath, JSON.stringify(allResults, null, 2), 'utf-8');
    writeFileSync(outputOfficialPath, JSON.stringify(officialSorted, null, 2), 'utf-8');
    writeFileSync(outputCommunityPath, JSON.stringify(communitySorted, null, 2), 'utf-8');

    console.log(`\n🎉 Successfully processed ${combinedResults.length}/${combinedUrls.length} servers (unique domains)`);
    console.log(`Results written:`);
    console.log(`- Combined: ${outputPath}`);
    console.log(`- Official: ${outputOfficialPath}`);
    console.log(`- Community: ${outputCommunityPath}`);

    // Summary
    const totalUsers = allResults.reduce((sum, s) => sum + (s.total_users ?? 0), 0);
    console.log('\n📊 Summary:');
    console.log(`- Total servers in output: ${allResults.length}`);
    console.log(`- Total active users across all servers: ${totalUsers.toLocaleString()}`);
    const languages = Array.from(new Set(allResults.flatMap((s) => s.languages).filter((l) => l && l !== 'Unknown')));
    console.log(`- Languages supported: ${languages.join(', ')}`);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { 
  main, 
  fetchInstanceInfo, 
  fetchHomepageDescription,
  extractMetaDescription,
  mapInstanceToServerInfo, 
  makeAbsoluteUrl, 
  createPlaceholderServerInfo, 
  generateTitleFromDomain, 
  capitalizePart,
  capitalizeDescription
};
