/**
 * Schema type for the output JSON file
 */
export interface ServerInfo {
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

  // extra fields not from the official api.joinmastodon.org response
  display_languages: string[];
  display_region?: string;
  logo?: string;
  icon?: string;
  display_language?: string;
}
