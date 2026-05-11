import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { Loader2, RefreshCw, CheckCircle2, AlertTriangle, XCircle, ClipboardList, ShieldCheck } from 'lucide-react';
import type { ComplianceSummary } from '@/types/api';

const BASE_URL = import.meta.env.VITE_API_URL || '';

async function complianceFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { credentials: 'include', ...options });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || res.statusText);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getOverallScore(scoreData: Record<string, any> | null): number | null {
  if (!scoreData) return null;
  if (typeof scoreData.overall === 'number') return scoreData.overall;
  if (typeof scoreData.score === 'number') return scoreData.score;
  return null;
}

function extractIssueList(flaggedIssues: Record<string, any> | null): string[] {
  if (!flaggedIssues) return [];
  if (Array.isArray(flaggedIssues.items)) return flaggedIssues.items;
  if (Array.isArray(flaggedIssues)) return flaggedIssues;
  return Object.values(flaggedIssues).filter((v): v is string => typeof v === 'string');
}

function ScoreIndicator({ score }: { score: number | null | undefined }) {
  if (score == null) return <span className="text-muted-foreground text-sm">N/A</span>;

  const color = score >= 80 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600';
  const Icon = score >= 80 ? CheckCircle2 : score >= 50 ? AlertTriangle : XCircle;
  const label = score >= 80 ? 'Good' : score >= 50 ? 'Fair' : 'Poor';

  return (
    <div className={`flex items-center gap-2 ${color}`}>
      <Icon className="h-5 w-5" />
      <span className="text-2xl font-bold">{score}</span>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

function ScoreBadge({ score }: { score: number | null | undefined }) {
  if (score == null) return <Badge variant="outline">N/A</Badge>;
  if (score >= 80) return <Badge className="bg-green-100 text-green-800 border-green-200">Good</Badge>;
  if (score >= 50) return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Fair</Badge>;
  return <Badge className="bg-red-100 text-red-800 border-red-200">Poor</Badge>;
}

function EmptyState({ onGenerate, isGenerating }: { onGenerate: () => void; isGenerating: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
      <ClipboardList className="h-12 w-12 text-muted-foreground" />
      <h2 className="text-xl font-semibold">No compliance data yet</h2>
      <p className="text-muted-foreground max-w-sm">
        Generate a compliance summary to see how your ecosystem is tracking against its governance agreements and domains.
      </p>
      <Button onClick={onGenerate} disabled={isGenerating}>
        {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
        Generate Summary
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ComplianceDashboard() {
  const { selected } = useEcosystem();
  const qc = useQueryClient();
  const [historyOpen, setHistoryOpen] = useState(false);

  const ecosystemId = selected?.id;

  const { data: latest, isLoading, error } = useQuery<ComplianceSummary>({
    queryKey: ['compliance', 'latest', ecosystemId],
    queryFn: () => complianceFetch<ComplianceSummary>(`/api/v1/compliance/latest?ecosystem_id=${ecosystemId}`),
    enabled: !!ecosystemId,
    retry: false,
  });

  const { data: history } = useQuery<ComplianceSummary[]>({
    queryKey: ['compliance', 'history', ecosystemId],
    queryFn: () => complianceFetch<ComplianceSummary[]>(`/api/v1/compliance/history?ecosystem_id=${ecosystemId}`),
    enabled: !!ecosystemId && historyOpen,
    retry: false,
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      complianceFetch<ComplianceSummary>('/api/v1/compliance/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ecosystem_id: ecosystemId }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compliance', 'latest', ecosystemId] });
      qc.invalidateQueries({ queryKey: ['compliance', 'history', ecosystemId] });
    },
  });

  if (!ecosystemId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Select an ecosystem to view compliance data.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasData = !!latest && !error;
  const overallScore = getOverallScore(latest?.score_data ?? null);
  const agreementCoverage = latest?.agreement_coverage;
  const domainHealth = latest?.domain_health;
  const issueList = extractIssueList(latest?.flagged_issues ?? null);

  if (!hasData) {
    return (
      <EmptyState
        onGenerate={() => generateMutation.mutate()}
        isGenerating={generateMutation.isPending}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-primary" />
            Compliance
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Generated {new Date(latest.generated_at).toLocaleString()}
          </p>
        </div>
        <Button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          variant="outline"
        >
          {generateMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Regenerate
        </Button>
      </div>

      {generateMutation.isError && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {generateMutation.error?.message || 'Failed to generate compliance summary'}
        </div>
      )}

      {/* Score overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Overall Score</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ScoreIndicator score={overallScore} />
          {latest.summary && (
            <p className="text-sm text-muted-foreground leading-relaxed">{latest.summary}</p>
          )}
        </CardContent>
      </Card>

      {/* Agreement coverage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Agreement Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          {agreementCoverage && Object.keys(agreementCoverage).length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Coverage</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(agreementCoverage).map(([key, val]) => (
                  <TableRow key={key}>
                    <TableCell className="font-medium capitalize">{key.replace(/_/g, ' ')}</TableCell>
                    <TableCell>{typeof val === 'number' ? `${val}%` : String(val)}</TableCell>
                    <TableCell>
                      {typeof val === 'number' && <ScoreBadge score={val <= 100 ? val : null} />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No agreement coverage data available</p>
          )}
        </CardContent>
      </Card>

      {/* Domain health */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Domain Health</CardTitle>
        </CardHeader>
        <CardContent>
          {domainHealth && Object.keys(domainHealth).length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead>Health</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(domainHealth).map(([key, val]) => (
                  <TableRow key={key}>
                    <TableCell className="font-medium capitalize">{key.replace(/_/g, ' ')}</TableCell>
                    <TableCell>
                      {typeof val === 'number' ? (
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                Number(val) >= 80 ? 'bg-green-500' : Number(val) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(100, Number(val))}%` }}
                            />
                          </div>
                          <span className="text-sm">{val}%</span>
                        </div>
                      ) : (
                        <span className="text-sm">{String(val)}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No domain health data available</p>
          )}
        </CardContent>
      </Card>

      {/* Flagged issues */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            Flagged Issues
          </CardTitle>
        </CardHeader>
        <CardContent>
          {issueList.length > 0 ? (
            <ul className="space-y-2">
              {issueList.map((issue, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-green-700 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              No flagged issues
            </p>
          )}
        </CardContent>
      </Card>

      {/* History */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setHistoryOpen(!historyOpen)}
        >
          {historyOpen ? 'Hide' : 'Show'} history
        </Button>

        {historyOpen && (
          <Card className="mt-3">
            <CardHeader>
              <CardTitle className="text-lg">Compliance History</CardTitle>
            </CardHeader>
            <CardContent>
              {!history ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading history...
                </div>
              ) : history.length === 0 ? (
                <p className="text-sm text-muted-foreground">No past summaries found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Summary</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-sm">{new Date(item.generated_at).toLocaleDateString()}</TableCell>
                        <TableCell><ScoreBadge score={getOverallScore(item.score_data)} /></TableCell>
                        <TableCell className="text-sm text-muted-foreground truncate max-w-xs">{item.summary || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Version fingerprint */}
      {latest.version_fingerprint && (
        <p className="text-xs text-muted-foreground text-center">
          Report fingerprint: {latest.version_fingerprint}
        </p>
      )}
    </div>
  );
}
