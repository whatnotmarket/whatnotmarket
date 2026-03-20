import { runJobWithLifecycle } from "../_shared/run-job";
import { requireJobsSupabaseAdminClient } from "../_shared/supabase";
import type { JobResult } from "../_shared/types";

const PENDING_ESCROW_STATUSES = ["pending", "funded_to_escrow", "awaiting_release"];
const PENDING_PAYMENT_INTENT_STATUSES = ["created", "awaiting_payment", "detected", "confirming"];

function isSchemaMissingError(message: string) {
  const normalized = String(message || "").toLowerCase();
  return (
    (normalized.includes("could not find the table") && normalized.includes("schema cache")) ||
    (normalized.includes("could not find the column") && normalized.includes("schema cache")) ||
    (normalized.includes("relation") && normalized.includes("does not exist"))
  );
}

export async function executeJob(): Promise<JobResult> {
  return runJobWithLifecycle({
    jobName: "admin/expire-timebound-records",
    leaseSeconds: 25 * 60,
    execute: async () => {
      const admin = await requireJobsSupabaseAdminClient();
      const nowIso = new Date().toISOString();
      const staleCutoffIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const [expiredInvitesResult, expiredVerificationsResult, staleEscrowResult, stalePaymentIntentsResult] =
        await Promise.all([
          admin
            .from("invite_codes")
            .update({ status: "expired" })
            .eq("status", "active")
            .lt("expires_at", nowIso)
            .select("code", { count: "exact" }),
          admin
            .from("seller_verifications")
            .update({ status: "expired" })
            .eq("status", "issued")
            .lt("expires_at", nowIso)
            .select("id", { count: "exact" }),
          admin
            .from("listing_payments")
            .select("id", { count: "exact", head: true })
            .in("status", PENDING_ESCROW_STATUSES)
            .lt("created_at", staleCutoffIso),
          admin
            .from("payment_intents")
            .select("id", { count: "exact", head: true })
            .in("status", PENDING_PAYMENT_INTENT_STATUSES)
            .lt("created_at", staleCutoffIso),
        ]);

      const missingSchemaRelations: string[] = [];

      let expiredInvites = 0;
      if (expiredInvitesResult.error) {
        if (isSchemaMissingError(expiredInvitesResult.error.message)) {
          missingSchemaRelations.push("invite_codes");
        } else {
          throw new Error(`Unable to expire invite codes: ${expiredInvitesResult.error.message}`);
        }
      } else {
        expiredInvites = expiredInvitesResult.count || expiredInvitesResult.data?.length || 0;
      }

      let expiredVerifications = 0;
      if (expiredVerificationsResult.error) {
        if (isSchemaMissingError(expiredVerificationsResult.error.message)) {
          missingSchemaRelations.push("seller_verifications");
        } else {
          throw new Error(`Unable to expire seller verifications: ${expiredVerificationsResult.error.message}`);
        }
      } else {
        expiredVerifications = expiredVerificationsResult.count || expiredVerificationsResult.data?.length || 0;
      }

      let staleEscrowQueue = 0;
      if (staleEscrowResult.error) {
        if (isSchemaMissingError(staleEscrowResult.error.message)) {
          missingSchemaRelations.push("listing_payments");
        } else {
          throw new Error(`Unable to count stale escrow queue: ${staleEscrowResult.error.message}`);
        }
      } else {
        staleEscrowQueue = staleEscrowResult.count || 0;
      }

      let stalePaymentIntents = 0;
      if (stalePaymentIntentsResult.error) {
        if (isSchemaMissingError(stalePaymentIntentsResult.error.message)) {
          missingSchemaRelations.push("payment_intents");
        } else {
          throw new Error(`Unable to count stale payment intents: ${stalePaymentIntentsResult.error.message}`);
        }
      } else {
        stalePaymentIntents = stalePaymentIntentsResult.count || 0;
      }

      let warnings = 0;
      if (staleEscrowQueue > 0) warnings += 1;
      if (stalePaymentIntents > 0) warnings += 1;
      if (missingSchemaRelations.length > 0) warnings += 1;

      return {
        message:
          missingSchemaRelations.length > 0
            ? "Time-bound records synchronized with partial schema coverage."
            : "Time-bound records synchronized.",
        details: {
          expired_invite_codes: expiredInvites,
          expired_seller_verifications: expiredVerifications,
          stale_escrow_queue_24h: staleEscrowQueue,
          stale_payment_intents_24h: stalePaymentIntents,
          missing_schema_relations: Array.from(new Set(missingSchemaRelations)),
        },
        metrics: {
          processed: expiredInvites + expiredVerifications,
          warnings,
        },
      };
    },
  });
}
