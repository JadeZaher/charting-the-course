import type { EngagementChannel, EngagementFamily, EngagementScope, Frequency } from '@/lib/engagement';

export interface CommunityPreview {
  id: string; name: string; description: string | null; tags: string[] | null;
  location: string | null; logo_url: string | null; preview_url: string; join_url: string;
  opportunities?: { id: string; title: string; url: string }[];
  opportunities_require_sign_in?: boolean;
}
export interface Activity {
  id: string; event_type: string; family: EngagementFamily; source_kind: EngagementScope;
  source_id: string; ecosystem_id: string | null; ecosystem_name: string | null;
  title: string; summary: string; url: string; occurred_at: string;
}
export interface InboxItem extends Activity { inbox_id: string; read_at: string | null; reason: string }
export interface Page<T> { items: T[]; next_cursor: string | null }
export interface InboxPage extends Page<InboxItem> { unread_count: number; unread_count_is_lower_bound?: boolean }
export interface EngagementPreferences {
  timezone: string; quiet_start: string | null; quiet_end: string | null; paused_until: string | null;
  email_enabled: boolean; push_enabled: boolean; sms_enabled: boolean; direct_messages: boolean;
}
export interface Contact {
  id: string; channel: 'email' | 'sms'; masked_destination: string; verified: boolean; suppressed?: boolean;
}
export interface Capability { state: 'pending_setup' | 'configured_disabled' | 'needs_verification' | 'ready' | 'suppressed'; reason?: string; public_key?: string; can_verify?: boolean }
export interface Capabilities { external_delivery_enabled: boolean; channels: Record<EngagementChannel, Capability>; contacts: Contact[] }
export interface EngagementSubscription {
  id: string; scope_kind: EngagementScope; scope_id: string; scope_label: string;
  event_families: EngagementFamily[]; channels: EngagementChannel[]; frequency: Frequency; muted: boolean;
}
export type SubscriptionInput = Omit<EngagementSubscription, 'id' | 'scope_label'>;
export interface ScopeOption { scope_kind: EngagementScope; scope_id: string; label: string; ecosystem_id?: string }
export interface ScopeOptions { items: ScopeOption[]; supported_kinds?: EngagementScope[] }
export interface VerificationPending { contact: Contact; challenge_id: string; status: 'verification_pending' }
