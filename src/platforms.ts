import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  PlatformsCatalog,
  PlatformId,
  PlatformProfile,
  PolicyDefinition,
} from "./types.js";

let rulesDirOverride: string | undefined;

/** IDE 插件等 CJS 打包环境请在 activate 时调用 */
export function setRulesDirectory(dir: string): void {
  rulesDirOverride = dir;
  resetCatalog();
}

let cached: {
  catalog: PlatformsCatalog;
  profiles: PlatformProfile[];
  byId: Map<string, PlatformProfile>;
  byAlias: Map<string, PlatformId>;
} | null = null;

function defaultRulesDir(): string | undefined {
  try {
    // ESM (CLI dist)；CJS bundle 下可能为空
    const meta = import.meta.url;
    if (meta) return join(dirname(fileURLToPath(meta)), "../rules");
  } catch {
    // ignore
  }
  return undefined;
}

function loadCatalogFile(): PlatformsCatalog {
  const candidates = [
    rulesDirOverride ? join(rulesDirOverride, "platforms.json") : "",
    defaultRulesDir() ? join(defaultRulesDir()!, "platforms.json") : "",
    join(process.cwd(), "rules/platforms.json"),
  ].filter(Boolean);

  for (const path of candidates) {
    try {
      return JSON.parse(readFileSync(path, "utf8")) as PlatformsCatalog;
    } catch {
      // try next
    }
  }
  throw new Error(
    `Cannot find rules/platforms.json (tried: ${candidates.join(", ") || "(none)"})`,
  );
}

function resolvePolicy(catalog: PlatformsCatalog, policyId: string): PolicyDefinition {
  return catalog.policies[policyId] ?? catalog.policies.balanced ?? {};
}

function hydrate(
  catalog: PlatformsCatalog,
  raw: PlatformsCatalog["profiles"][number],
): PlatformProfile {
  const policy = resolvePolicy(catalog, raw.policy);
  return {
    ...raw,
    elevateCategories: policy.elevateCategories,
    focusCategories: policy.focusCategories,
  };
}

function ensure(): NonNullable<typeof cached> {
  if (cached) return cached;
  const catalog = loadCatalogFile();
  const profiles = catalog.profiles.map((p) => hydrate(catalog, p));
  const byId = new Map(profiles.map((p) => [p.id, p]));
  const byAlias = new Map<string, PlatformId>();
  for (const p of profiles) {
    byAlias.set(p.id.toLowerCase(), p.id);
    byAlias.set(p.name.toLowerCase(), p.id);
    for (const alias of p.aliases ?? []) {
      byAlias.set(alias.toLowerCase(), p.id);
    }
  }
  cached = { catalog, profiles, byId, byAlias };
  return cached;
}

function resetCatalog(): void {
  cached = null;
}

export const PLATFORM_PROFILES: Record<string, PlatformProfile> = new Proxy(
  {},
  {
    get(_t, prop: string) {
      return ensure().byId.get(prop);
    },
    ownKeys() {
      return ensure().profiles.map((p) => p.id);
    },
    getOwnPropertyDescriptor(_t, prop: string) {
      if (ensure().byId.has(prop)) {
        return { configurable: true, enumerable: true, value: ensure().byId.get(prop) };
      }
      return undefined;
    },
  },
);

export function resolvePlatform(id?: string): PlatformId {
  const { byId, byAlias } = ensure();
  if (!id || !id.trim()) return "generic";
  const key = id.trim().toLowerCase();
  return byAlias.get(key) ?? (byId.has(id.trim()) ? id.trim() : "generic");
}

export function listPlatforms(): PlatformProfile[] {
  return ensure().profiles;
}

export function getPlatform(id?: string): PlatformProfile {
  const { byId } = ensure();
  const resolved = resolvePlatform(id);
  return byId.get(resolved) ?? byId.get("generic")!;
}

export function catalogMeta(): { version: number; updated: string; note: string; count: number } {
  const { catalog, profiles } = ensure();
  return {
    version: catalog.version,
    updated: catalog.updated,
    note: catalog.note,
    count: profiles.length,
  };
}
