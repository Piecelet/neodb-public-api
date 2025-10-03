# NeoDB Public Instance Information

A comprehensive tool for collecting and maintaining information about public NeoDB instances across the fediverse.

## 🚀 Features

- **Automated Data Collection**: Daily automated fetching of instance information via Mastodon API
- **Smart Description Extraction**: Intelligent fallback to homepage meta tags when API descriptions are empty
- **Multi-language Support**: Handles Chinese, English, and other language descriptions
- **Thumbnail Processing**: Converts relative URLs to absolute paths
- **Error Resilience**: Creates placeholder entries for failed instances
- **Title Generation**: Smart domain-to-title conversion with special handling for "DB" terminology

## 📁 Project Structure

```
├── data/
│   └── server/
│       ├── _source/
│       │   └── server.txt           # List of NeoDB instance URLs
│       ├── _tool/
│       │   ├── fetch-instances.ts   # Main data collection script
│       │   └── Instance.ts          # TypeScript interfaces
│       ├── schema.json              # Output data schema
│       └── server.json              # Generated instance data
├── .github/
│   └── workflows/
│       └── fetch-instances.yml      # Automated daily updates
└── server/
    └── routes/
        └── index.ts                 # API endpoints
```

## 🔄 Automated Updates

The repository is automatically updated daily at 02:00 UTC (10:00 AM Beijing time) via GitHub Actions. The workflow:

1. **Fetches Latest Data**: Calls `/api/v2/instance` endpoint for each server
2. **Extracts Descriptions**: Falls back to homepage meta tags if API description is empty
3. **Processes Thumbnails**: Converts relative URLs to absolute paths
4. **Generates Titles**: Creates friendly display titles from domain names
5. **Commits Changes**: Only commits if there are actual changes to the data

### Manual Trigger

You can manually trigger the update process:

```bash
# Install dependencies
pnpm install

# Run the data collection script
pnpm run fetch-instances
```

## 📊 Data Schema

The generated `server.json` follows this schema:

```json
{
  "domain": "string",           // Server domain name
  "version": "string",          // NeoDB version
  "title": "string",            // Generated friendly title
  "description": "string",      // Server description (API or homepage)
  "languages": ["string"],      // Supported languages
  "region": "string",           // Detected geographical region
  "categories": ["string"],     // Server categories
  "proxied_thumbnail": "string", // Absolute thumbnail URL
  "blurhash": "string",         // Thumbnail blurhash
  "total_users": "number",      // Total active users
  "last_week_users": "number",  // Weekly active users
  "approval_required": "boolean", // Registration approval requirement
  "language": "string",         // Primary language
  "category": "string"          // Primary category
}
```

## 🛠 Development

### Prerequisites

- Node.js 20+
- pnpm 10+

### Setup

```bash
# Clone the repository
git clone https://github.com/Piecelet/neodb-public-api
cd neodb-public-api

# Install dependencies
pnpm install

# Run the development server
pnpm dev

# Build for production
pnpm build
```

### Adding New Instances

To add a new NeoDB instance:

1. Add the instance URL to `data/server/_source/server.txt`
2. Run `pnpm run fetch-instances` to collect the data
3. Commit the changes

## 🤖 GitHub Actions Workflow

The automated workflow (`fetch-instances.yml`) includes:

- **Schedule**: Daily execution at 02:00 UTC
- **Manual Trigger**: `workflow_dispatch` for on-demand runs
- **Smart Commits**: Only commits when there are actual changes
- **Comprehensive Logging**: Detailed output for monitoring

### Workflow Features

- Uses pnpm for fast, reliable package management
- Caches dependencies for faster runs
- Provides detailed commit messages with timestamps
- Includes summary of changes made

## 📝 API Documentation

The project provides a simple API endpoint:

- `GET /` - Returns the collected instance data as JSON

## 🔍 Monitoring

The GitHub Actions workflow provides:

- **Success/Failure Status**: Visible in the Actions tab
- **Change Detection**: Only updates when data actually changes
- **Detailed Logs**: Full process logging for debugging
- **Commit History**: Track all data updates over time

## 📄 License

This project is open source and follows the same license as the broader NeoDB ecosystem.

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

For bugs or feature requests, please open an issue with detailed information.

---

**Note**: This tool is designed to work with the NeoDB ecosystem and uses the Mastodon-compatible API endpoints that NeoDB instances expose.