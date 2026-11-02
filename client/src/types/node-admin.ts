export interface NodeAdminBadgeValue { key: 'node_admin'; label: string }
export interface SupportProvenance {
  actor_user_id: string;
  actor_name: string;
  organization_id: string;
  action_id: string;
}
export interface SupportField {
  name: string;
  label: string;
  type: string;
  editable: boolean;
  required: boolean;
  options?: Array<string | { value: string; label: string }>;
  reference?: string | null;
}
export interface SupportResourceSpec {
  key: string;
  label: string;
  organization_scoped: boolean;
  fields: SupportField[];
  actions: string[];
  listing_fields: string[];
}
export interface SupportCatalog {
  items: SupportResourceSpec[];
  organizations: Array<{ id: string; name: string }>;
  reason_categories: string[];
}
export type SupportRecord = Record<string, unknown> & { id: string; version?: string };
export interface SupportCommand {
  resource_type: string;
  resource_id?: string;
  action: string;
  organization_id?: string;
  values: Record<string, unknown>;
  reason: string;
  expected_version?: string;
}
export interface SupportReceipt { resource: SupportRecord; audit_id: string; audit_url: string }
export interface NodeAdminReceipt { user_id: string; active: boolean; audit_id: string; audit_url: string }
export interface SupportArchive { id: string; action_id: string; resource_type: string; resource_id: string; created_at: string }
export interface NodeAdminAssignment {
  user_id: string;
  display_name: string;
  active: boolean;
  granted_at: string;
  granted_by_user_id: string | null;
  revoked_at: string | null;
}
export interface NodeAdminUser { id: string; display_name: string; username: string | null }
export interface PublicSupportAudit {
  id: string;
  actor_user_id: string;
  actor_name: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  organization_id: string | null;
  reason: string;
  outcome: string;
  changed_fields: string[];
  created_at: string;
}
export interface SupportPage<T> { items: T[]; total: number; page: number; per_page: number }

export interface PublicNodeAdmin { user_id: string; display_name: string; node_admin_badge?: NodeAdminBadgeValue }
