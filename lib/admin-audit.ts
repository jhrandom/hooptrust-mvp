import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export async function recordAdminAction(
  supabase: SupabaseClient,
  adminId: string,
  action: string,
  entityType: string,
  entityId: string,
  details: Record<string, unknown> = {}
) {
  const { error } = await supabase.from("admin_action_logs").insert({
    admin_id: adminId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details
  });
  if (error) console.error("Could not record admin audit action:", error.message);
}
