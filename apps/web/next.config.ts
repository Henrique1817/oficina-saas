import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(__dirname, "../..");

// Carrega Oficina/.env (createRequire evita erro de tipos do @next/env no build Docker)
const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env") as {
  loadEnvConfig: (dir: string) => void;
};
loadEnvConfig(monorepoRoot);

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: monorepoRoot,
  transpilePackages: ["@oficina/database", "@oficina/shared", "@oficina/auth"],
  serverExternalPackages: ["@prisma/client", "prisma"],
  // O tracing do Next não segue os symlinks do pnpm até o query engine do Prisma
  outputFileTracingIncludes: {
    "/**": [
      "../../node_modules/.pnpm/@prisma+client*/node_modules/.prisma/client/*.node",
      "../../node_modules/.pnpm/@prisma+client*/node_modules/.prisma/client/schema.prisma",
    ],
  },
};

export default nextConfig;
