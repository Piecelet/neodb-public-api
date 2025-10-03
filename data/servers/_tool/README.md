# NeoDB Instance Fetcher

TypeScript tool for fetching NeoDB/Mastodon instance info from curated source lists and producing JSON outputs that align with the project schema.

## Overview

- Sources two lists of instances: official and community.
- Fetches each instance using Mastodon API `GET /api/v2/instance` with a 10s timeout.
- Backfills description from the instance homepage `<meta>` when missing.
- Normalizes and maps data into the ServerInfo shape.
- Sorts by active users and writes combined and group-specific outputs.

## Inputs

- `data/servers/_source/servers-official.txt`
- `data/servers/_source/servers.txt`

Notes for the .txt files:
- The order in the file does not affect the final ordering (output is sorted by active users).
- Use `#` or `;` for comments. Anything after these on a line is ignored.
- Multiple URLs in a single line are supported; the parser splits on each `http(s)://` occurrence.

## Outputs

- `data/servers/servers.json` — combined list, official first then community, both sorted by `total_users` desc (ties by domain asc). Duplicates are removed by domain, preferring official.
- `data/servers/servers-official.json` — official-only, sorted by `total_users` desc.
- `data/servers/servers-community.json` — community-only (excluding domains listed in official), sorted by `total_users` desc.

All outputs conform to `data/servers/_tool/types/ServerInfo.ts`.

## How It Works

1. Parse URLs from both source files (strip inline comments and whitespace; validate with `new URL()`).
2. Build a unique combined domain set and fetch in a single concurrent pool.
3. For each domain:
   - Fetch `https://{domain}/api/v2/instance`.
   - If `description` is empty, fetch the homepage and extract the first matching `<meta name="description" ...>` or `<meta property="og:description" ...>` (any attribute order supported).
   - Normalize thumbnail URLs to absolute using the WHATWG `URL` API.
   - Map to `ServerInfo` (region inferred from TLD, title derived from domain with special `DB` handling).
   - On failure, create a placeholder with `total_users = 0` and optional homepage description.
4. Split results back into official/community groups, sort internally by `total_users` desc, and write files.

## Concurrency

- A single worker pool fetches all unique domains from both lists.
- Concurrency is configurable via env var: `CONCURRENCY` (default: `6`).
- A small random jitter (0–250ms) is applied between tasks to avoid bursty patterns.

## Command

Run with a TS runner (e.g., tsx):

```bash
# from repo root
npx tsx data/servers/_tool/fetch-instances.ts

# customize parallelism
CONCURRENCY=8 npx tsx data/servers/_tool/fetch-instances.ts
```

This script requires a runtime that supports `fetch` (Node 20+ recommended).

## Code Structure

- `data/servers/_tool/fetch-instances.ts` — main entry (wires inputs, concurrency, grouping, sorting, and writing outputs).
- `data/servers/_tool/lib/parse.ts` — URL/domain parsing, HTML meta extraction, input file parsing.
- `data/servers/_tool/lib/net.ts` — network calls: instance API + homepage fetch.
- `data/servers/_tool/lib/transform.ts` — data normalization, title/region helpers, mapping to `ServerInfo`.
- `data/servers/_tool/lib/process.ts` — concurrent worker pool (`processServerList`).
- `data/servers/_tool/lib/util.ts` — placeholder builder and sorting.
- `data/servers/_tool/types` — TypeScript types (`Instance`, `ServerInfo`).

## Data Shape (ServerInfo)

```ts
export interface ServerInfo {
  domain: string
  version: string
  title: string
  description: string
  languages: string[]
  region: string
  categories: string[]
  proxied_thumbnail: string
  blurhash: string
  total_users: number
  last_week_users: number
  approval_required: boolean
  language: string
  category: string
}
```

## API Reference

- Mastodon: https://docs.joinmastodon.org/methods/instance/

## Troubleshooting

- Empty or invalid lines in source files are ignored; use `#` or `;` for comments.
- If the script exits quickly with network errors, check your environment’s network permissions and TLS settings.
- If you see burst request rejections, reduce `CONCURRENCY`.
