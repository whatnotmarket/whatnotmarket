import { maintenanceEarlyAccessAutoReplyHtml, maintenanceEarlyAccessAutoReplyText } from "../../src/lib/email-templates/maintenance-early-access";
import { runJobWithLifecycle } from "../_shared/run-job";
import { isTransientNetworkError, sleep, withRetry } from "../_shared/retry";
import { requireJobsSupabaseAdminClient } from "../_shared/supabase";
import type { JobResult } from "../_shared/types";

type EarlyAccessLead = {
  id: string;
  email: string;
  email_normalized: string;
  status: "pending" | "confirmed" | "email_failed";
  updated_at: string;
};

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

async function createResendClient() {
  try {
    const { Resend } = (await import("resend")) as typeof import("resend");
    return new Resend(getRequiredEnv("RESEND_API_KEY"));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to initialize Resend client: ${reason}`);
  }
}

export async function executeJob(): Promise<JobResult> {
  return runJobWithLifecycle({
    jobName: "maintenance/retry-early-access-emails",
    leaseSeconds: 50 * 60,
    execute: async ({ logger }) => {
      const admin = await requireJobsSupabaseAdminClient();
      const resend = await createResendClient();
      const from = getRequiredEnv("RESEND_FROM_EMAIL");
      const batchSize = Math.max(1, Math.min(Number(process.env.CRON_EARLY_ACCESS_RETRY_BATCH || "40"), 200));
      const minDelayMs = Math.max(0, Number(process.env.CRON_EARLY_ACCESS_RETRY_DELAY_MS || "250"));

      const { data: leads, error } = await admin
        .from("maintenance_early_access_leads")
        .select("id,email,email_normalized,status,updated_at")
        .eq("status", "email_failed")
        .order("updated_at", { ascending: true })
        .limit(batchSize)
        .returns<EarlyAccessLead[]>();

      if (error) {
        throw new Error(`Unable to load early-access leads to retry: ${error.message}`);
      }

      if (!leads || leads.length === 0) {
        return {
          message: "No email_failed leads to retry.",
          metrics: {
            skipped: 1,
          },
        };
      }

      let processed = 0;
      let failed = 0;
      let warnings = 0;

      for (const lead of leads) {
        const recipient = String(lead.email_normalized || lead.email || "").trim();
        if (!recipient) {
          warnings += 1;
          failed += 1;
          continue;
        }

        try {
          await withRetry(
            async () => {
              const result = await resend.emails.send({
                from,
                to: recipient,
                subject: "Welcome to Openly!",
                html: maintenanceEarlyAccessAutoReplyHtml,
                text: maintenanceEarlyAccessAutoReplyText,
              });

              if (result.error) {
                throw new Error(result.error.message || "Resend API returned an error.");
              }
            },
            {
              attempts: 3,
              baseDelayMs: 600,
              shouldRetry: (err) => isTransientNetworkError(err),
            }
          );

          const nowIso = new Date().toISOString();
          const { error: updateError } = await admin
            .from("maintenance_early_access_leads")
            .update({
              status: "confirmed",
              confirmed_at: nowIso,
              updated_at: nowIso,
              last_error: null,
            })
            .eq("id", lead.id);

          if (updateError) {
            throw new Error(`Unable to mark lead as confirmed: ${updateError.message}`);
          }

          processed += 1;
        } catch (leadError) {
          failed += 1;
          warnings += 1;
          const nowIso = new Date().toISOString();
          const message = toErrorMessage(leadError);
          logger.warn("Failed to resend early-access confirmation", {
            leadId: lead.id,
            error: message,
          });
          await admin
            .from("maintenance_early_access_leads")
            .update({
              status: "email_failed",
              updated_at: nowIso,
              last_error: message,
            })
            .eq("id", lead.id);
        }

        if (minDelayMs > 0) {
          await sleep(minDelayMs);
        }
      }

      return {
        message: `Retried ${leads.length} failed lead(s).`,
        details: {
          batch_size: batchSize,
          attempted: leads.length,
          recovered: processed,
          still_failed: failed,
        },
        metrics: {
          processed,
          failed,
          warnings,
        },
      };
    },
  });
}
