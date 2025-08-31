# NeoDB 实例信息获取脚本

这个 TypeScript 脚本用于从 NeoDB 服务器列表中获取实例信息，并生成符合指定 schema 的 JSON 文件。

## 功能

- 从 `server-data/server.txt` 读取 NeoDB 服务器 URL 列表
- 调用每个服务器的 Mastodon API (`/api/v2/instance`) 获取实例信息
- 将获取的数据映射到符合 `server-data/schema.json` 的格式
- 生成静态 JSON 文件保存到 `server-data/server.json`

## 使用方法

### 运行脚本

```bash
# 使用 pnpm
pnpm run fetch-instances

# 或直接使用 npx tsx
npx tsx fetch-instances.ts
```

### 输入文件

- `server-data/server.txt`: 包含 NeoDB 服务器 URL 的文本文件，每行一个 URL
- `server-data/Instance.ts`: TypeScript 接口定义，描述 Mastodon API 返回的数据结构
- `server-data/schema.json`: 输出 JSON 文件的 schema 定义

### 输出文件

- `server-data/server.json`: 生成的静态 JSON 文件，包含所有成功获取的服务器信息

## 输出格式

生成的 JSON 文件包含以下字段：

```json
{
  "domain": "服务器域名",
  "version": "服务器版本",
  "description": "服务器描述",
  "languages": ["支持的语言列表"],
  "region": "服务器所在地区",
  "categories": ["服务器分类"],
  "proxied_thumbnail": "缩略图 URL",
  "blurhash": "缩略图 blurhash",
  "total_users": "总用户数",
  "last_week_users": "上周活跃用户数",
  "approval_required": "是否需要审核",
  "language": "主要语言",
  "category": "主要分类"
}
```

## 特性

- **错误处理**: 对于无法访问的服务器，脚本会记录错误并继续处理其他服务器
- **速率限制**: 请求之间有 1 秒的延迟，以避免对服务器造成过大负担
- **详细日志**: 提供详细的处理日志和最终统计信息
- **超时保护**: 每个请求有 10 秒的超时限制
- **地区检测**: 基于域名 TLD 自动检测服务器地区

## 运行示例

```bash
$ pnpm run fetch-instances

Found 6 servers to process...

Processing 1/6: neodb.social
Fetching: https://neodb.social/api/v2/instance
✓ Successfully fetched info for neodb.social
✓ Processed neodb.social successfully
Waiting 1 second...

...

🎉 Successfully processed 4/6 servers
Results written to: /path/to/server-data/server.json

📊 Summary:
- Total servers processed: 4
- Failed servers: 2
- Total active users across all servers: 24,399
- Languages supported: en
- Regions: Unknown, Europe
```

## 依赖

- Node.js (支持 ESM 和 fetch API)
- tsx (用于直接运行 TypeScript 文件)

## API 参考

脚本使用 [Mastodon Instance API v2](https://docs.joinmastodon.org/methods/instance/) 获取服务器信息。
