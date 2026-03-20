import { runJobWithLifecycle } from "../_shared/run-job";
import { requireJobsSupabaseAdminClient } from "../_shared/supabase";
import type { JobResult } from "../_shared/types";

type AbuseEventRow = {
  action: string;
  blocked: boolean;
};

function isSchemaMissingError(message: string) {
  const normalized = String(message || "").toLowerCase();
  return (
    (normalized.includes("could not find the table") && normalized.includes("schema cache")) ||
    (normalized.includes("could not find the column") && normalized.includes("schema cache")) ||
    (normalized.includes("relation") && normalized.includes("does not exist"))
  );
}

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

      const missingSchemaRelations: string[] = [];

      let abuseRows: AbuseEventRow[] = [];
      if (abuseEventsRes.error) {
        if (isSchemaMissingError(abuseEventsRes.error.message)) {
          missingSchemaRelations.push("security_abuse_events");
        } else {
          throw new Error(`Unable to read security abuse events: ${abuseEventsRes.error.message}`);
        }
      } else {
        abuseRows = abuseEventsRes.data || [];
      }

      let abuseBlocked24h = 0;
      if (abuseBlockedRes.error) {
        if (isSchemaMissingError(abuseBlockedRes.error.message)) {
          missingSchemaRelations.push("security_abuse_events");
        } else {
          throw new Error(`Unable to count blocked abuse events: ${abuseBlockedRes.error.message}`);
        }
      } else {
        abuseBlocked24h = abuseBlockedRes.count || 0;
      }

      let suspiciousTrust24h = 0;
      if (trustSuspiciousRes.error) {
        if (isSchemaMissingError(trustSuspiciousRes.error.message)) {
          missingSchemaRelations.push("trust_security_events");
        } else {
          throw new Error(`Unable to count suspicious trust events: ${trustSuspiciousRes.error.message}`);
        }
      } else {
        suspiciousTrust24h = trustSuspiciousRes.count || 0;
      }

      let openReports = 0;
      if (reportsOpenRes.error) {
        if (isSchemaMissingError(reportsOpenRes.error.message)) {
          missingSchemaRelations.push("trust_reports");
        } else {
          throw new Error(`Unable to count trust reports: ${reportsOpenRes.error.message}`);
        }
      } else {
        openReports = reportsOpenRes.count || 0;
      }

      let highPriorityOpenReports = 0;
      if (reportsHighPriorityRes.error) {
        if (isSchemaMissingError(reportsHighPriorityRes.error.message)) {
          missingSchemaRelations.push("trust_reports");
        } else {
          throw new Error(`Unable to count high-priority trust reports: ${reportsHighPriorityRes.error.message}`);
        }
      } else {
        highPriorityOpenReports = reportsHighPriorityRes.count || 0;
      }

      let agedModerationCases48h = 0;
      if (casesAgedRes.error) {
        if (isSchemaMissingError(casesAgedRes.error.message)) {
          missingSchemaRelations.push("trust_moderation_cases");
        } else {
          throw new Error(`Unable to count aged moderation cases: ${casesAgedRes.error.message}`);
        }
      } else {
        agedModerationCases48h = casesAgedRes.count || 0;
      }

      let earlyAccessEmailFailures = 0;
      if (earlyFailedRes.error) {
        if (isSchemaMissingError(earlyFailedRes.error.message)) {
          missingSchemaRelations.push("maintenance_early_access_leads");
        } else {
          throw new Error(`Unable to count maintenance email failures: ${earlyFailedRes.error.message}`);
        }
      } else {
        earlyAccessEmailFailures = earlyFailedRes.count || 0;
      }

      const abuseTotal24h = abuseRows.length;

      let warnings = 0;
      if (abuseBlocked24h >= 20) warnings += 1;
      if (highPriorityOpenReports >= 10) warnings += 1;
      if (agedModerationCases48h > 0) warnings += 1;
      if (earlyAccessEmailFailures > 0) warnings += 1;
      if (missingSchemaRelations.length > 0) warnings += 1;

      return {
        message:
          missingSchemaRelations.length > 0
            ? "Daily security digest generated with partial schema coverage."
            : "Daily security digest generated.",
        details: {
          abuse_total_24h: abuseTotal24h,
          abuse_blocked_24h: abuseBlocked24h,
          trust_suspicious_events_24h: suspiciousTrust24h,
          trust_reports_open: openReports,
          trust_reports_high_priority_open: highPriorityOpenReports,
          trust_cases_aged_48h: agedModerationCases48h,
          maintenance_email_failed_backlog: earlyAccessEmailFailures,
          top_abuse_actions: topActions(abuseRows),
          missing_schema_relations: Array.from(new Set(missingSchemaRelations)),
        },
        metrics: {
          processed: 7,
          warnings,
        },
      };
    },
  });
}
