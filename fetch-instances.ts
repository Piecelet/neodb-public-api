#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { Instance } from './server-data/Instance';

/**
 * Schema type for the output JSON file
 */
interface ServerInfo {
  domain: string;
  version: string;
  title: string;
  description: string;
  languages: string[];
  region: string;
  categories: string[];
  proxied_thumbnail: string;
  blurhash: string;
  total_users: number;
  last_week_users: number;
  approval_required: boolean;
  language: string;
  category: string;
}

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
    const homeUrl = `https://${domain}/`;
    console.log(`  Fetching homepage description: ${homeUrl}`);
    
    const response = await fetch(homeUrl, {
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
    const apiUrl = `https://${domain}/api/v2/instance`;
    console.log(`Fetching: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
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
function makeAbsoluteUrl(url: string, domain: string): string {
  try {
    // If already absolute URL, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // If relative URL, prepend domain
    if (url.startsWith('/')) {
      return `https://${domain}${url}`;
    }
    
    // If relative path without leading slash
    return `https://${domain}/${url}`;
  } catch (error) {
    console.warn(`Failed to convert URL for ${domain}: ${url}`, error);
    return url;
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
 * Capitalize a domain part
 */
function capitalizePart(part: string): string {
  // Regular capitalization - first letter uppercase, rest lowercase
  return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
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

/**
 * Main function to process all servers
 */
async function main() {
  try {
    // Read server list
    const serverListPath = join(process.cwd(), 'server-data', 'server.txt');
    const serverList = readFileSync(serverListPath, 'utf-8')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    console.log(`Found ${serverList.length} servers to process...`);

    const successfulResults: ServerInfo[] = [];
    const failedResults: ServerInfo[] = [];

    // Process each server with rate limiting
    for (let i = 0; i < serverList.length; i++) {
      const url = serverList[i];
      const domain = extractDomain(url);
      
      if (!domain) {
        console.warn(`Skipping invalid URL: ${url}`);
        continue;
      }

      console.log(`\nProcessing ${i + 1}/${serverList.length}: ${domain}`);

      const instanceData = await fetchInstanceInfo(domain);
      
      if (instanceData) {
        // Check if description is empty and try to fetch from homepage
        let description = instanceData.description || '';
        if (!description.trim()) {
          console.log(`  API description is empty, fetching from homepage...`);
          description = await fetchHomepageDescription(domain);
        }
        
        // Create a modified instance with the potentially updated description
        const enhancedInstanceData = {
          ...instanceData,
          description
        };
        
        const serverInfo = mapInstanceToServerInfo(enhancedInstanceData, domain);
        successfulResults.push(serverInfo);
        console.log(`✓ Processed ${domain} successfully`);
      } else {
        // For failed servers, try to get description from homepage as well
        console.log(`  API failed, attempting to fetch description from homepage...`);
        const homepageDescription = await fetchHomepageDescription(domain);
        const placeholderInfo = createPlaceholderServerInfo(domain);
        placeholderInfo.description = homepageDescription;
        failedResults.push(placeholderInfo);
        console.warn(`✗ Created placeholder for ${domain} due to errors`);
      }

      // Rate limiting: wait 1 second between requests to be respectful
      if (i < serverList.length - 1) {
        console.log('Waiting 1 second...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Combine results: successful servers first, failed servers at the bottom
    const allResults = [...successfulResults, ...failedResults];

    // Write results to server.json
    const outputPath = join(process.cwd(), 'server-data', 'server.json');
    writeFileSync(outputPath, JSON.stringify(allResults, null, 2), 'utf-8');

    console.log(`\n🎉 Successfully processed ${allResults.length}/${serverList.length} servers`);
    console.log(`Results written to: ${outputPath}`);

    // Print summary
    console.log('\n📊 Summary:');
    console.log(`- Total servers in output: ${allResults.length}`);
    console.log(`- Successful servers: ${successfulResults.length}`);
    console.log(`- Failed servers (with placeholders): ${failedResults.length}`);
    
    if (successfulResults.length > 0) {
      const totalUsers = successfulResults.reduce((sum, server) => sum + server.total_users, 0);
      console.log(`- Total active users across successful servers: ${totalUsers.toLocaleString()}`);
      
      const languages = Array.from(new Set(successfulResults.flatMap(s => s.languages).filter(lang => lang !== 'Unknown')));
      console.log(`- Languages supported: ${languages.join(', ')}`);
      
      const regions = Array.from(new Set(successfulResults.map(s => s.region).filter(region => region !== 'Unknown')));
      console.log(`- Regions: ${regions.join(', ')}`);
    }

    if (failedResults.length > 0) {
      console.log(`- Failed server domains: ${failedResults.map(s => s.domain).join(', ')}`);
    }

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
  capitalizePart 
};
