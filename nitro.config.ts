import { defineNitroConfig } from "nitropack/config"

// https://nitro.build/config
export default defineNitroConfig({
  compatibilityDate: "2025-08-15",
  srcDir: "server",
  preset: "cloudflare_module",
  cloudflare: {
    deployConfig: true,
    nodeCompat: true
  },
  // Enable JSON imports
  rollupConfig: {
    external: [],
    output: {
      format: "esm"
    }
  },
  // Include data files in the bundle
  publicAssets: [
    {
      dir: "data",
      maxAge: 60 * 60 * 24 * 7 // 7 days
    }
  ]
})
