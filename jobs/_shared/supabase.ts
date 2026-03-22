type QueryResultLike = {
  data: { [key: string]: unknown; length?: number } | Array<unknown> | null;
  count?: number | null;
  error: { message: string } | null;
};

type QueryBuilderLike = PromiseLike<QueryResultLike> & {
  [method: string]: (...args: unknown[]) => QueryBuilderLike;
};

type GenericSupabaseClient = {
  from: (...args: unknown[]) => QueryBuilderLike;
  rpc: (fn: string, params?: Record<string, unknown>) => Promise<QueryResultLike>;
};

let cachedClientPromise: Promise<GenericSupabaseClient | null> | null = null;

function firstNonEmptyEnv(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return "";
}

export async function getJobsSupabaseAdminClient(): Promise<GenericSupabaseClient | null> {
  if (cachedClientPromise) {
    return cachedClientPromise;
  }

  cachedClientPromise = (async () => {
    const supabaseUrl = firstNonEmptyEnv("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL");
    const serviceRoleKey = firstNonEmptyEnv(
      "SUPABASE_SERVICE_ROLE_KEY",
      "SUPABASE_SERVICE_KEY",
      "SUPABASE_SERVICE_ROLE"
    );
    if (!supabaseUrl || !serviceRoleKey) {
      return null;
    }

    let createClient: ((url: string, key: string, options: Record<string, unknown>) => GenericSupabaseClient) | null =
      null;
    try {
      const supabaseModule = await import("@supabase/supabase-js");
      createClient = supabaseModule.createClient as unknown as (
        url: string,
        key: string,
        options: Record<string, unknown>
      ) => GenericSupabaseClient;
    } catch {
      throw new Error("Missing dependency @supabase/supabase-js. Run npm install before executing cron jobs.");
    }

    return createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  })();

  return cachedClientPromise;
}

export async function requireJobsSupabaseAdminClient(): Promise<GenericSupabaseClient> {
  const client = await getJobsSupabaseAdminClient();
  if (!client) {
    throw new Error(
      "Supabase admin connection is not configured. Provide NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY)."
    );
  }
  return client;
}
