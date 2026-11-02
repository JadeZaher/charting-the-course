import { ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import type { SupportProvenance } from '@/types/node-admin';
import { supportAuditPath } from '@/lib/node-admin';

export function NodeAdminBadge() {
  return <Badge variant="outline"><ShieldCheck className="mr-1 h-3 w-3" aria-hidden="true" />Node admin</Badge>;
}
export function SupportAttribution({ provenance, showReceipt = true }: { provenance?: SupportProvenance | null; showReceipt?: boolean }) {
  if (!provenance) return null;
  return <p className="flex flex-wrap items-center gap-2 text-sm"><NodeAdminBadge />Created by {provenance.actor_name} on behalf of organization {provenance.organization_id}. {showReceipt && <Link className="underline" href={supportAuditPath(provenance.action_id)}>View public support record</Link>}</p>;
}
