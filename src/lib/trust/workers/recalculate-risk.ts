import { createAdminClient } from "@/lib/supabase-admin";
import { evaluateAndPersistUserRisk } from "@/lib/trust/services/user-risk-service";

type WorkerResult = {
  processedUsers: number;
  failures: number;
};

export async function runTrustRiskRecalculationWorker(limit = 200): Promise<WorkerResult> {
  const admin = createAdminClient();
  const { data: users, error } = await admin
    .from("profiles")
    .select("id")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error || !users) {
    throw new Error(error?.message || "Unable to load users for trust worker");
  }

  let processedUsers = 0;
  let failures = 0;

  for (const user of users) {
    try {
      await evaluateAndPersistUserRisk(user.id);
      processedUsers += 1;
    } catch {
      failures += 1;
    }
  }

  return {
    processedUsers,
    failures,
  };
}
