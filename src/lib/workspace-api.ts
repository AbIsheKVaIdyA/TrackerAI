import type { PartnerId, Workspace } from "@/lib/types";
import type { WorkspaceRow } from "@/lib/couple";
import { workspaceToSettings } from "@/lib/couple";

export interface MembershipPayload {
  workspace: Workspace;
  partnerId: PartnerId;
  settings: ReturnType<typeof workspaceToSettings>;
  memberCount: number;
}

export function toWorkspace(row: WorkspaceRow): Workspace {
  return {
    id: row.id,
    name: row.name,
    inviteCode: row.invite_code,
    partnerAName: row.partner_a_name,
    partnerBName: row.partner_b_name,
    showFairness: !!row.show_fairness,
  };
}
