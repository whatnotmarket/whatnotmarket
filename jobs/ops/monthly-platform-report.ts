import { runJobWithLifecycle } from "../_shared/run-job";
import { requireJobsSupabaseAdminClient } from "../_shared/supabase";
import type { JobResult } from "../_shared/types";

type SupabaseAdminClient = Awaited<ReturnType<typeof requireJobsSupabaseAdminClient>>;
type SupabaseQuery = ReturnType<SupabaseAdminClient["from"]>;

async function countRows(
  admin: SupabaseAdminClient,
  table: string,
  filter?: (query: SupabaseQuery) => SupabaseQuery
) {
  let query = admin.from(table).select("id", { count: "exact", head: true });
  if (filter) {
    query = filter(query);
  }
  const { count, error } = await query;
  if (error) {
    throw new Error(`Unable to count ${table}: ${error.message}`);
  }
  return count || 0;
}

export async function executeJob(): Promise<JobResult> {
  return runJobWithLifecycle({
    jobName: "ops/monthly-platform-report",
    leaseSeconds: 40 * 60,
    execute: async () => {
      const admin = await requireJobsSupabaseAdminClient();
      const since30Iso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [
        usersTotal,
        users30d,
        requestsTotal,
        requests30d,
        dealsTotal,
        deals30d,
        listingPaymentsTotal,
        listingPayments30d,
        trustReportsOpen,
        trustCasesOpen,
        earlyAccessTotal,
        earlyAccessConfirmed,
      ] = await Promise.all([
        countRows(admin, "profiles"),
        countRows(admin, "profiles", (q) => q.gte("created_at", since30Iso)),
        countRows(admin, "requests"),
        countRows(admin, "requests", (q) => q.gte("created_at", since30Iso)),
        countRows(admin, "deals"),
        countRows(admin, "deals", (q) => q.gte("created_at", since30Iso)),
        countRows(admin, "listing_payments"),
        countRows(admin, "listing_payments", (q) => q.gte("created_at", since30Iso)),
        countRows(admin, "trust_reports", (q) => q.in("status", ["open", "in_review"])),
        countRows(admin, "trust_moderation_cases", (q) => q.in("status", ["open", "in_review", "appealed"])),
        countRows(admin, "maintenance_early_access_leads"),
        countRows(admin, "maintenance_early_access_leads", (q) => q.eq("status", "confirmed")),
      ]);

      return {
        message: "Monthly platform report generated.",
        details: {
          users_total: usersTotal,
          users_last_30d: users30d,
          requests_total: requestsTotal,
          requests_last_30d: requests30d,
          deals_total: dealsTotal,
          deals_last_30d: deals30d,
          listing_payments_total: listingPaymentsTotal,
          listing_payments_last_30d: listingPayments30d,
          trust_reports_open: trustReportsOpen,
          trust_moderation_cases_open: trustCasesOpen,
          maintenance_early_access_total: earlyAccessTotal,
          maintenance_early_access_confirmed: earlyAccessConfirmed,
        },
        metrics: {
          processed: 12,
          warnings: trustReportsOpen > 20 || trustCasesOpen > 20 ? 1 : 0,
        },
      };
    },
  });
}
