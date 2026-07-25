import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(__dirname, "../..");

// createRequire evita erros de tipos de pacotes sem .d.ts (@next/env, plugin Prisma)
const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env") as {
  loadEnvConfig: (dir: string) => void;
};
loadEnvConfig(monorepoRoot);

const { PrismaPlugin } = require("@prisma/nextjs-monorepo-workaround-plugin") as {
  PrismaPlugin: new () => object;
};

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: monorepoRoot,
  transpilePackages: ["@oficina/database", "@oficina/shared", "@oficina/auth"],
  serverExternalPackages: ["@prisma/client", "prisma"],
  // Garante que o query engine do Prisma entre no bundle serverless (pnpm monorepo → Vercel)
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [...(config.plugins ?? []), new PrismaPlugin()];
    }
    return config;
  },
};

export default nextConfig;
