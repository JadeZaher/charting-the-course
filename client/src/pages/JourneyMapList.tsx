import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { fetchEcosystems } from "@/lib/api-client";
import { Plus, Edit, Trash2, Copy, Map, Star, CheckCircle, XCircle, Search } from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL || '';
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { credentials: 'include', ...options });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as any).error || res.statusText);
  }
  return res.json();
}

interface JourneyMap {
  id: string;
  ecosystem_id: string | null;
  slug: string;
  title: string;
  description: string | null;
  sector_alignment: string[] | null;
  role_types: string[] | null;
  min_alignment_score: number;
  step_count: number;
  content_sequence: any[];
  exit_package: any;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at?: string;
  ethos?: { name: string; slug: string } | null;
}

interface EthosOption {
  id: string;
  name: string;
  slug: string;
}

export default function JourneyMapList() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [ethosFilter, setEthosFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<JourneyMap | null>(null);
  const [hardDeleteTarget, setHardDeleteTarget] = useState<JourneyMap | null>(null);

  // Fetch journey maps
  const { data: maps = [], isLoading } = useQuery<JourneyMap[]>({
    queryKey: ["journey-maps-list", ethosFilter, activeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (ethosFilter !== "all") params.set("ethos_id", ethosFilter);
      if (activeFilter !== "all") params.set("is_active", activeFilter);
      const result = await apiFetch<any>(
        `/api/v1/orientation/journey-maps${params.toString() ? `?${params.toString()}` : ""}`
      );
      return (result?.maps ?? result?.items ?? []) as JourneyMap[];
    },
  });

  // Fetch ETHOS list for filter dropdown
  const { data: ethosList = [] } = useQuery<EthosOption[]>({
    queryKey: ["ethos-list-filter"],
    queryFn: async () => {
      const result = await fetchEcosystems();
      const items = (result as any)?.ecosystems ?? (result as any)?.items ?? (Array.isArray(result) ? result : []);
      return items.map((e: any) => ({ id: e.id, name: e.name, slug: e.slug })) as EthosOption[];
    },
  });

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiFetch<any>(`/api/v1/orientation/journey-maps/${id}/duplicate`, { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journey-maps-list"] });
      toast({ title: "Map duplicated", description: "A copy has been created." });
    },
    onError: (err: any) => {
      toast({ title: "Duplicate failed", description: err.message, variant: "destructive" });
    },
  });

  // Soft delete mutation
  const softDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiFetch<any>(`/api/v1/orientation/journey-maps/${id}/deactivate`, { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journey-maps-list"] });
      toast({ title: "Map deactivated", description: "The journey map has been set to inactive." });
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    },
  });

  // Hard delete mutation
  const hardDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiFetch<any>(`/api/v1/orientation/journey-maps/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journey-maps-list"] });
      toast({ title: "Map deleted permanently", variant: "destructive" });
      setHardDeleteTarget(null);
    },
    onError: (err: any) => {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    },
  });

  const filteredMaps = maps.filter((m) =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Journey Maps</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create and manage orientation journey sequences for ETHOS organizations
          </p>
        </div>
        <Button onClick={() => setLocation("/admin/journey-maps/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Journey
        </Button>
      </div>

      {/* Filters */}
      <Card className="rounded-none border-2 border-strong-border shadow-none">
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title or slug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={ethosFilter} onValueChange={setEthosFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by ETHOS" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ETHOS</SelectItem>
                {ethosList.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <section aria-label="Journey maps">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Loading journey maps">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-72 animate-pulse border-2 border-strong-border bg-muted" />
              ))}
            </div>
          ) : filteredMaps.length === 0 ? (
            <div className="border-2 border-dashed border-strong-border p-12 text-center">
              <Map className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-1">No journey maps found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery || ethosFilter !== "all" || activeFilter !== "all"
                  ? "Try adjusting your filters."
                  : "Create your first journey map to get started."}
              </p>
              {!searchQuery && ethosFilter === "all" && activeFilter === "all" && (
                <Button onClick={() => setLocation("/admin/journey-maps/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Journey
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredMaps.map((map) => (
                <Card key={map.id} className="flex h-full flex-col rounded-none border-2 border-strong-border bg-card shadow-none">
                  <CardHeader className="gap-3 border-b-2 border-strong-border p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="text-xl font-black tracking-tight">{map.title}</CardTitle>
                        <CardDescription className="mt-1 truncate font-mono text-xs">{map.slug}</CardDescription>
                      </div>
                      <div className="flex shrink-0 items-center gap-2" aria-label="Journey map status">
                        {map.is_active ? (
                          <CheckCircle className="h-4 w-4 text-success" aria-label="Active" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" aria-label="Inactive" />
                        )}
                        {map.is_default && <Star className="h-4 w-4 fill-warning text-warning" aria-label="Default journey" />}
                      </div>
                    </div>
                    {map.ethos ? (
                      <Badge variant="outline" className="w-fit rounded-none">{map.ethos.name}</Badge>
                    ) : (
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">No ETHOS assigned</p>
                    )}
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-5 p-5">
                    <div>
                      <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-muted-foreground">Sector alignment</p>
                      {(map.sector_alignment?.length ?? 0) > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {map.sector_alignment!.map((sector) => (
                            <Badge key={sector} variant="secondary" className="rounded-none text-xs">{sector}</Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-muted-foreground">No sector alignment</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 border-y border-border py-4">
                      <div>
                        <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-muted-foreground">Steps</p>
                        <p className="mt-1 text-lg font-black">{Array.isArray(map.content_sequence) ? map.content_sequence.length : 0}</p>
                      </div>
                      <div>
                        <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-muted-foreground">Status</p>
                        <p className="mt-1 text-sm font-black">{map.is_active ? "Active" : "Inactive"}</p>
                      </div>
                    </div>
                    <div className="mt-auto flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        className="min-h-11 rounded-none"
                        onClick={() => setLocation(`/admin/journey-maps/${map.id}`)}
                      >
                        <Edit className="mr-2 h-4 w-4" aria-hidden="true" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        className="min-h-11 min-w-11 rounded-none p-0"
                        onClick={() => duplicateMutation.mutate(map.id)}
                        disabled={duplicateMutation.isPending}
                        aria-label={`Duplicate ${map.title}`}
                      >
                        <Copy className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        className="min-h-11 min-w-11 rounded-none p-0 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(map)}
                        aria-label={`Deactivate ${map.title}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
      </section>

      {/* Soft Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate journey map?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.title}" will be set to inactive and hidden from users. You can
              reactivate it by editing the map. To permanently delete, confirm again after this step.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  softDeleteMutation.mutate(deleteTarget.id);
                  // Escalate to hard delete prompt
                  setHardDeleteTarget(deleteTarget);
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hard Delete Confirmation */}
      <AlertDialog open={!!hardDeleteTarget} onOpenChange={() => setHardDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete this map?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{hardDeleteTarget?.title}" and all associated data. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep It</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => hardDeleteTarget && hardDeleteMutation.mutate(hardDeleteTarget.id)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
