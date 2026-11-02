import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'wouter';
import NodeAdministration from './node-admin/NodeAdministration';

export default function AdminPanel() {
  const { isNodeAdmin, isLoading, user } = useAuth();
  if (isLoading) return <p role="status">Checking node support authority?</p>;
  if (!isNodeAdmin) return <div className="space-y-3"><h1 className="text-2xl font-bold">Node admin access required</h1><p>This support page is for assigned node admins.</p><Link className="underline" href="/node/audit">View public support history</Link></div>;
  return <NodeAdministration key={user?.id ?? 'node-admin'} />;
}
