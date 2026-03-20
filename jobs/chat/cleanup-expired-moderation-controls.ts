import { runJobWithLifecycle } from "../_shared/run-job";
import { requireJobsSupabaseAdminClient } from "../_shared/supabase";
import type { JobResult } from "../_shared/types";

export async function executeJob(): Promise<JobResult> {
  return runJobWithLifecycle({
    jobName: "chat/cleanup-expired-moderation-controls",
    leaseSeconds: 20 * 60,
    execute: async () => {
      const admin = await requireJobsSupabaseAdminClient();
      const nowIso = new Date().toISOString();

      const [unmuted, unbanned, reopenedRooms] = await Promise.all([
        admin
          .from("global_chat_user_controls")
          .update({ is_muted: false, muted_until: null })
          .eq("is_muted", true)
          .lt("muted_until", nowIso)
          .select("user_id", { count: "exact" }),
        admin
          .from("global_chat_user_controls")
          .update({ is_banned: false, banned_until: null })
          .eq("is_banned", true)
          .lt("banned_until", nowIso)
          .select("user_id", { count: "exact" }),
        admin
          .from("global_chat_room_state")
          .update({ closed_until: null })
          .lt("closed_until", nowIso)
          .select("room_slug", { count: "exact" }),
      ]);

      if (unmuted.error) {
        throw new Error(`Unable to cleanup expired mutes: ${unmuted.error.message}`);
      }
      if (unbanned.error) {
        throw new Error(`Unable to cleanup expired bans: ${unbanned.error.message}`);
      }
      if (reopenedRooms.error) {
        throw new Error(`Unable to reopen expired room closures: ${reopenedRooms.error.message}`);
      }

      const unmutedCount = unmuted.count || unmuted.data?.length || 0;
      const unbannedCount = unbanned.count || unbanned.data?.length || 0;
      const reopenedCount = reopenedRooms.count || reopenedRooms.data?.length || 0;
      const processed = unmutedCount + unbannedCount + reopenedCount;

      return {
        message:
          processed > 0
            ? "Expired moderation controls cleaned up."
            : "No expired moderation controls found.",
        details: {
          unmuted_users: unmutedCount,
          unbanned_users: unbannedCount,
          reopened_rooms: reopenedCount,
        },
        metrics: {
          processed,
          skipped: processed === 0 ? 1 : 0,
        },
      };
    },
  });
}
