import { runJobWithLifecycle } from "../_shared/run-job";
import { requireJobsSupabaseAdminClient } from "../_shared/supabase";
import type { JobResult } from "../_shared/types";

type AbuseEventRow = {
  action: string;
  blocked: boolean;
};

function topActions(rows: AbuseEventRow[], limit = 5) {
  const map = new Map<string, { total: number; blocked: number }>();
  for (const row of rows) {
    const key = String(row.action || "unknown");
    const current = map.get(key) || { total: 0, blocked: 0 };
    current.total += 1;
    if (row.blocked) current.blocked += 1;
    map.set(key, current);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, limit)
    .map(([action, stats]) => ({ action, ...stats }));
}

export async function executeJob(): Promise<JobResult> {
  return runJobWithLifecycle({
    jobName: "security/daily-signals-digest",
    leaseSeconds: 20 * 60,
    execute: async () => {
      const admin = await requireJobsSupabaseAdminClient();
      const since24Iso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const since48Iso = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

      const [abuseEventsRes, abuseBlockedRes, trustSuspiciousRes, reportsOpenRes, reportsHighPriorityRes, casesAgedRes, earlyFailedRes] =
        await Promise.all([
          admin
            .from("security_abuse_events")
            .select("action,blocked")
            .gte("created_at", since24Iso)
            .limit(4000)
            .returns<AbuseEventRow[]>(),
          admin
            .from("security_abuse_events")
            .select("id", { count: "exact", head: true })
            .eq("blocked", true)
            .gte("created_at", since24Iso),
          admin
            .from("trust_security_events")
            .select("id", { count: "exact", head: true })
            .eq("is_suspicious", true)
            .gte("created_at", since24Iso),
          admin
            .from("trust_reports")
            .select("id", { count: "exact", head: true })
            .in("status", ["open", "in_review"]),
          admin
            .from("trust_reports")
            .select("id", { count: "exact", head: true })
            .in("status", ["open", "in_review"])
            .gte("priority", 4),
          admin
            .from("trust_moderation_cases")
            .select("id", { count: "exact", head: true })
            .in("status", ["open", "in_review", "appealed"])
            .lt("created_at", since48Iso),
          admin
            .from("maintenance_early_access_leads")
            .select("id", { count: "exact", head: true })
            .eq("status", "email_failed"),
        ]);

      if (abuseEventsRes.error) throw new Error(`Unable to read security abuse events: ${abuseEventsRes.error.message}`);
      if (abuseBlockedRes.error) throw new Error(`Unable to count blocked abuse events: ${abuseBlockedRes.error.message}`);
      if (trustSuspiciousRes.error) throw new Error(`Unable to count suspicious trust events: ${trustSuspiciousRes.error.message}`);
      if (reportsOpenRes.error) throw new Error(`Unable to count trust reports: ${reportsOpenRes.error.message}`);
      if (reportsHighPriorityRes.error) throw new Error(`Unable to count high-priority trust reports: ${reportsHighPriorityRes.error.message}`);
      if (casesAgedRes.error) throw new Error(`Unable to count aged moderation cases: ${casesAgedRes.error.message}`);
      if (earlyFailedRes.error) throw new Error(`Unable to count maintenance email failures: ${earlyFailedRes.error.message}`);

      const abuseRows = abuseEventsRes.data || [];
      const abuseTotal24h = abuseRows.length;
      const abuseBlocked24h = abuseBlockedRes.count || 0;
      const suspiciousTrust24h = trustSuspiciousRes.count || 0;
      const openReports = reportsOpenRes.count || 0;
      const highPriorityOpenReports = reportsHighPriorityRes.count || 0;
      const agedModerationCases48h = casesAgedRes.count || 0;
      const earlyAccessEmailFailures = earlyFailedRes.count || 0;

      let warnings = 0;
      if (abuseBlocked24h >= 20) warnings += 1;
      if (highPriorityOpenReports >= 10) warnings += 1;
      if (agedModerationCases48h > 0) warnings += 1;
      if (earlyAccessEmailFailures > 0) warnings += 1;

      return {
        message: "Daily security digest generated.",
        details: {
          abuse_total_24h: abuseTotal24h,
          abuse_blocked_24h: abuseBlocked24h,
          trust_suspicious_events_24h: suspiciousTrust24h,
          trust_reports_open: openReports,
          trust_reports_high_priority_open: highPriorityOpenReports,
          trust_cases_aged_48h: agedModerationCases48h,
          maintenance_email_failed_backlog: earlyAccessEmailFailures,
          top_abuse_actions: topActions(abuseRows),
        },
        metrics: {
          processed: 7,
          warnings,
        },
      };
    },
  });
}
