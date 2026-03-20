type GenericSupabaseClient = {
  from: (...args: unknown[]) => any;
  rpc: (...args: unknown[]) => any;
};

let cachedClientPromise: Promise<GenericSupabaseClient | null> | null = null;

export async function getJobsSupabaseAdminClient(): Promise<GenericSupabaseClient | null> {
  if (cachedClientPromise) {
    return cachedClientPromise;
  }

  cachedClientPromise = (async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!supabaseUrl || !serviceRoleKey) {
      return null;
    }

    let createClient: ((url: string, key: string, options: Record<string, unknown>) => GenericSupabaseClient) | null =
      null;
    try {
      const module = await import("@supabase/supabase-js");
      createClient = module.createClient as (
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
      "Supabase admin connection is not configured. Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  return client;
}
