import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Read NEXT_PUBLIC_* values from the project's root .env, so all apps share one settings file. */
function rootPublicEnv() {
  const file = resolve(import.meta.dirname, "../../.env");
  if (!existsSync(file)) return {};
  return Object.fromEntries(
    readFileSync(file, "utf8")
      .split(/\r?\n/)
      .map((line) => line.match(/^\s*(NEXT_PUBLIC_[A-Z0-9_]+)\s*=\s*(.*)\s*$/))
      .filter(Boolean)
      .map(([, key, value]) => [key, value.trim()]),
  );
}

const root = rootPublicEnv();

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? root.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
    NEXT_PUBLIC_SHOP_URL: process.env.NEXT_PUBLIC_SHOP_URL ?? root.NEXT_PUBLIC_SHOP_URL ?? "http://localhost:3000",
  },
  // Product photos live in the shop's public folder (http://localhost:3000/assets/images/...)
  images: {
    remotePatterns: [{ protocol: "http", hostname: "localhost", port: "3000" }],
  },
};

export default nextConfig;
