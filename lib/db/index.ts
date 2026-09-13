import "server-only";
import { ConfigError, getSupabaseConfig, isTestMode } from "../env";
import { createMemoryRepo } from "./memory";
import { createSupabaseRepo } from "./supabase";
import type { Repo } from "./types";

let repo: Repo | undefined;

export function db(): Repo {
  if (repo) return repo;
  const supabase = getSupabaseConfig();
  if (supabase) {
    repo = createSupabaseRepo(supabase.url, supabase.serviceRoleKey);
  } else if (isTestMode()) {
    console.warn("[db] SUPABASE_URL kosong — memakai database memori (mode test).");
    repo = createMemoryRepo();
  } else {
    throw new ConfigError("Database belum dikonfigurasi: isi SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY.");
  }
  return repo;
}

export function isMemoryDb(): boolean {
  return !getSupabaseConfig() && isTestMode();
}

export * from "./types";
