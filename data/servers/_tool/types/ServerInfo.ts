/**
 * Schema type for the output JSON file
 */
export interface ServerInfo {
  domain: string;
  version: string;
  title: string;
  description: string;
  languages: string[];
  display_languages: string[];
  region: string;
  display_region: string;
  categories: string[];
  proxied_thumbnail: string;
  blurhash: string;
  icon: string;
  total_users: number;
  last_week_users: number;
  approval_required: boolean;
  language: string;
  display_language: string;
  category: string;
}
