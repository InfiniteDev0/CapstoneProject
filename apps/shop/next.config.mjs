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

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep the dev "N" bubble away from the scroll-to-top arrow (bottom-left)
  devIndicators: { position: "bottom-right" },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? rootPublicEnv().NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
  },
};

export default nextConfig;
