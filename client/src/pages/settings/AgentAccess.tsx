import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAgentTokens, useMintAgentToken, useRevokeAgentToken } from '@/hooks/use-governance';
import { useToast } from '@/hooks/use-toast';
import { Bot, Copy, KeyRound, Loader2, Plus, ShieldCheck, Trash2 } from 'lucide-react';

// Agent access (MCP): mint session-scoped bearer tokens so the member's own
// agents can connect to the governance MCP server and do permissioned
// agreement-building work on their behalf.
export default function AgentAccessPage() {
  const { data, isLoading, error, refetch } = useAgentTokens();
  const mintMutation = useMintAgentToken();
  const revokeMutation = useRevokeAgentToken();
  const { toast } = useToast();

  const [label, setLabel] = useState('');
  const [days, setDays] = useState('7');
  const [freshToken, setFreshToken] = useState<string | null>(null);

  const apiBase = import.meta.env.VITE_API_URL || window.location.origin;
  const mcpUrl = `${String(apiBase).replace(/\/$/, '')}:8100/mcp`;

  const handleMint = async () => {
    try {
      const minted = await mintMutation.mutateAsync({
        label: label.trim() || undefined,
        expires_in_days: Math.min(30, Math.max(1, parseInt(days, 10) || 7)),
      });
      setFreshToken(minted.token ?? null);
      setLabel('');
      toast({ title: 'Agent token minted', description: 'Copy it now — it is only shown once.' });
    } catch (e) {
      toast({ title: 'Could not mint token', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' });
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await revokeMutation.mutateAsync(id);
      toast({ title: 'Token revoked', description: 'The agent using it loses access immediately.' });
    } catch (e) {
      toast({ title: 'Could not revoke token', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' });
    }
  };

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  const tokens = data?.items ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><Bot className="h-5 w-5" /> Connect your own agent (MCP)</CardTitle>
          <CardDescription>
            Your agent connects to the governance MCP server and acts with your authority — only in
            ecosystems where you are a participating member, and only while your session lives.
            Logging out or revoking the token ends the agent's access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">MCP endpoint</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 border-2 border-strong-border bg-muted px-3 py-2 text-xs break-all">{mcpUrl}</code>
              <Button variant="outline" size="sm" className="min-h-11" onClick={() => copy(mcpUrl)}><Copy className="h-4 w-4" /></Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Configure your MCP client with this URL and an{' '}
              <code className="font-mono">Authorization: Bearer &lt;token&gt;</code> header. For Claude Code:{' '}
              <code className="font-mono">claude mcp add --transport http neos {mcpUrl} --header "Authorization: Bearer &lt;token&gt;"</code>
            </p>
          </div>

          <div className="border-2 border-strong-border p-4 space-y-3">
            <p className="text-sm font-medium flex items-center gap-2"><KeyRound className="h-4 w-4" /> Mint a token</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="token_label">Label</Label>
                <Input id="token_label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Claude on my laptop" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="token_days">Expires in (days, max 30)</Label>
                <Input id="token_days" type="number" min={1} max={30} value={days} onChange={(e) => setDays(e.target.value)} />
              </div>
            </div>
            <Button onClick={handleMint} disabled={mintMutation.isPending} className="min-h-11">
              {mintMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Mint token
            </Button>
            {freshToken && (
              <div className="border-2 border-warning bg-warning/10 p-3 space-y-2">
                <p className="text-sm font-medium">Shown once — copy it now:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-background border border-strong-border px-3 py-2 text-xs break-all">{freshToken}</code>
                  <Button variant="outline" size="sm" className="min-h-11" onClick={() => copy(freshToken)}><Copy className="h-4 w-4" /></Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <p>
              Tokens are bound to the login session they were minted from: your agent can only do what
              you can do, and its access dies when you log out, when the token expires, or when you
              revoke it here.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your agent tokens</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
          ) : error ? (
            <div className="text-sm text-destructive">
              Could not load tokens.{' '}
              <Button variant="outline" size="sm" className="ml-2 min-h-11" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : tokens.length === 0 ? (
            <p className="text-sm text-muted-foreground">No agent tokens yet — mint one above to connect your first agent.</p>
          ) : (
            <ul className="divide-y divide-border">
              {tokens.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{t.label}</p>
                    <p className="text-xs text-muted-foreground">
                      Created {t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}
                      {' · '}expires {t.expires_at ? new Date(t.expires_at).toLocaleDateString() : '—'}
                      {t.last_used_at ? ` · last used ${new Date(t.last_used_at).toLocaleString()}` : ' · never used'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {t.revoked ? (
                      <Badge variant="outline" className="text-muted-foreground">revoked</Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="min-h-11 text-destructive"
                        onClick={() => handleRevoke(t.id)}
                        disabled={revokeMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Revoke
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
