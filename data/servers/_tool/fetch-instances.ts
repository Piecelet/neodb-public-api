#!/usr/bin/env node

import { writeFileSync } from 'fs'
import { join } from 'path'
import { readServerUrls, extractDomain, processServerList, sortByUsersDesc } from './lib/'

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

    // Concurrency from env or default 10
    const concurrency = Number.parseInt(process.env.CONCURRENCY ?? '10', 10) || 10;
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

    // Sanitize unknown values: when unknown, leave empty instead of "Unknown"
    const sanitize = (item: any) => {
      const out: any = { ...item };
      // Strings: blank out 'Unknown'/'unknown'
      for (const [k, v] of Object.entries(out)) {
        if (typeof v === 'string') {
          if (v === 'Unknown' || v === 'unknown') {
            out[k] = '';
          }
        } else if (Array.isArray(v)) {
          // Arrays of strings: remove Unknown entries
          out[k] = v.filter((x) => typeof x === 'string' && x !== 'Unknown' && x !== 'unknown');
        }
      }
      return out;
    };
    const officialClean = officialSorted.map(sanitize);
    const communityClean = communitySorted.map(sanitize);
    const allResults = [...officialClean, ...communityClean];

    // Write results
    const outputPath = join(base, 'servers.json');
    const outputOfficialPath = join(base, 'servers-official.json');
    const outputCommunityPath = join(base, 'servers-community.json');
    writeFileSync(outputPath, JSON.stringify(allResults, null, 2), 'utf-8');
    writeFileSync(outputOfficialPath, JSON.stringify(officialClean, null, 2), 'utf-8');
    writeFileSync(outputCommunityPath, JSON.stringify(communityClean, null, 2), 'utf-8');

    console.log(`\n🎉 Successfully processed ${combinedResults.length}/${combinedUrls.length} servers (unique domains)`);
    console.log(`Results written:`);
    console.log(`- Combined: ${outputPath}`);
    console.log(`- Official: ${outputOfficialPath}`);
    console.log(`- Community: ${outputCommunityPath}`);

    // Summary
    const totalUsers = allResults.reduce((sum, s) => sum + (s.total_users ?? 0), 0)
    console.log('\n📊 Summary:');
    console.log(`- Total servers in output: ${allResults.length}`);
    console.log(`- Total active users across all servers: ${totalUsers.toLocaleString()}`);
    const languages = Array.from(new Set(allResults.flatMap((s) => s.languages).filter((l) => l)));
    console.log(`- Languages supported: ${languages.join(', ')}`);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1)
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { 
  main, 
  // re-exports for convenience
  // parsing
  readServerUrls,
  extractDomain,
  // processing
  processServerList,
  // utils
  sortByUsersDesc,
};
