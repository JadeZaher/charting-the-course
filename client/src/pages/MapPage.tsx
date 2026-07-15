import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { updateMember, apiFetch, ApiFetchError } from "@/lib/api-client";
import { APP_SETTINGS_KEYS } from "@/lib/utils";
import { resolvePreziEmbedUrl, resolvePreziUrl } from "@/lib/media";
import { MapPin, Edit, Plus, Loader2, ExternalLink } from "lucide-react";

// ——————————————————————————————————————————————
// Types
// ——————————————————————————————————————————————
interface CtcMapSettings {
  prezi_url: string;
  description: string;
}

interface PersonalMapData {
  personal_map_url: string | null;
  personal_map_notes: string | null;
}

// ——————————————————————————————————————————————
// Prezi embed iframe
// ——————————————————————————————————————————————
function MapEmbed({ url, title }: { url: string; title: string }) {
  return (
    <div className="overflow-hidden border border-strong-border">
      <iframe
        src={url}
        title={title}
        width="100%"
        height="500"
        className="block"
        loading="lazy"
        referrerPolicy="no-referrer"
        sandbox="allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts"
        allowFullScreen
        allow="fullscreen"
      />
    </div>
  );
}

// ——————————————————————————————————————————————
// Main Page
// ——————————————————————————————————————————————
export default function MapPage() {
  const { member } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [personalMapDialogOpen, setPersonalMapDialogOpen] = useState(false);
  const [personalMapForm, setPersonalMapForm] = useState({
    personal_map_url: "",
    personal_map_notes: "",
  });

  // ——— CTC Map settings ———
  // Settings absent or endpoint not implemented (404) → "not configured" defaults; only real failures error.
  const { data: ctcSettings, isLoading: ctcLoading, error: ctcError } = useQuery<CtcMapSettings>({
    queryKey: ["ctc-map-settings"],
    queryFn: async () => {
      try {
        const result = await apiFetch<any>(`/api/v1/settings?key=${APP_SETTINGS_KEYS.ctcMap}`);
        return (result?.value || { prezi_url: "", description: "" }) as CtcMapSettings;
      } catch (err) {
        if (err instanceof ApiFetchError && err.status === 404) {
          return { prezi_url: "", description: "" } as CtcMapSettings;
        }
        throw err;
      }
    },
  });

  // ——— Own profile personal map ———
  const { data: personalMap, isLoading: personalLoading } = useQuery<PersonalMapData>({
    queryKey: ["personal-map", member?.id],
    queryFn: async () => {
      if (!member) return { personal_map_url: null, personal_map_notes: null };
      const result = await apiFetch<any>(`/api/v1/members/${member.id}`);
      const m = result?.member ?? result?.data ?? result;
      return {
        personal_map_url: m?.personal_map_url ?? null,
        personal_map_notes: m?.personal_map_notes ?? null,
      } as PersonalMapData;
    },
    enabled: !!member,
  });

  // ——— Save personal map ———
  const savePersonalMapMutation = useMutation({
    mutationFn: async (values: { personal_map_url: string; personal_map_notes: string }) => {
      if (!member) throw new Error("Not authenticated");
      const submittedUrl = values.personal_map_url.trim();
      const safeUrl = submittedUrl ? resolvePreziUrl(submittedUrl) : undefined;
      if (submittedUrl && !safeUrl) throw new Error("Enter a valid HTTPS Prezi URL");
      await updateMember(member.id, {
        personal_map_url: safeUrl || null,
        personal_map_notes: values.personal_map_notes || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal-map", member?.id] });
      toast({ title: "Your map has been saved!" });
      setPersonalMapDialogOpen(false);
    },
    onError: (err: any) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    },
  });

  function openEditPersonalMap() {
    setPersonalMapForm({
      personal_map_url: personalMap?.personal_map_url || "",
      personal_map_notes: personalMap?.personal_map_notes || "",
    });
    setPersonalMapDialogOpen(true);
  }

  const ctcSourceUrl = ctcSettings?.prezi_url || "";
  const ctcUrl = resolvePreziUrl(ctcSourceUrl);
  const ctcEmbedUrl = resolvePreziEmbedUrl(ctcSourceUrl);
  const ctcDescription = ctcSettings?.description || "";
  const personalSourceUrl = personalMap?.personal_map_url || "";
  const personalUrl = resolvePreziUrl(personalSourceUrl);
  const personalEmbedUrl = resolvePreziEmbedUrl(personalSourceUrl);
  const personalNotes = personalMap?.personal_map_notes || "";

  return (
    <div className="space-y-8">
      {/* ——— Section 1: CTC Goals Map ——— */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Charting the Course — Goals Map</h1>
            <p className="text-sm text-muted-foreground">
              The shared organizational map that defines our collective direction
            </p>
          </div>
        </div>

        {ctcLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-8">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading map...
          </div>
        ) : ctcError ? (
          <Card>
            <CardContent className="py-6" role="alert">
              <p className="font-bold text-destructive">The CTC goals map could not be loaded.</p>
              <p className="text-sm text-muted-foreground mt-1">{(ctcError as Error).message}</p>
            </CardContent>
          </Card>
        ) : ctcUrl && ctcEmbedUrl ? (
          <div className="space-y-3">
            {ctcDescription && (
              <p className="text-muted-foreground">{ctcDescription}</p>
            )}
            <MapEmbed url={ctcEmbedUrl} title="Charting the Course Goals Map" />
            <div className="flex justify-end">
              <a
                href={ctcUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Open in Prezi
              </a>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No CTC goals map has been configured yet. Administrators can add one in the Admin
                Panel under Settings.
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* ——— Section 2: Personal Map ——— */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-xl font-bold tracking-tight">Your Map</h2>
              <p className="text-sm text-muted-foreground">
                Your personal Prezi or vision map — share your individual journey
              </p>
            </div>
          </div>
          {personalSourceUrl && (
            <Button variant="outline" size="sm" onClick={openEditPersonalMap}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Map
            </Button>
          )}
        </div>

        {personalLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading your map...
          </div>
        ) : personalUrl && personalEmbedUrl ? (
          <div className="space-y-3">
            {personalNotes && (
              <p className="text-muted-foreground text-sm">{personalNotes}</p>
            )}
            <MapEmbed url={personalEmbedUrl} title="Your Personal Map" />
            <div className="flex justify-end">
              <a
                href={personalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Open in Prezi
              </a>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">
                {personalSourceUrl ? "Map link unavailable" : "No personal map yet"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {personalSourceUrl
                  ? "Update the saved link with a supported HTTPS Prezi share URL."
                  : "Add your personal Prezi map to share your vision and journey with the community."}
              </p>
              <Button onClick={openEditPersonalMap}>
                <Plus className="h-4 w-4 mr-2" />
                {personalSourceUrl ? "Update Your Map" : "Add Your Map"}
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      {/* ——— Personal Map Dialog ——— */}
      <Dialog open={personalMapDialogOpen} onOpenChange={setPersonalMapDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{personalSourceUrl ? "Edit Your Map" : "Add Your Map"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="personal-map-url">Prezi URL</Label>
              <Input
                id="personal-map-url"
                value={personalMapForm.personal_map_url}
                onChange={(e) =>
                  setPersonalMapForm((f) => ({ ...f, personal_map_url: e.target.value }))
                }
                placeholder="https://prezi.com/p/your-map-id/"
              />
              <p className="text-xs text-muted-foreground">
                Paste your Prezi share link. It will be automatically converted to an embed.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="personal-map-notes">Notes (optional)</Label>
              <Textarea
                id="personal-map-notes"
                value={personalMapForm.personal_map_notes}
                onChange={(e) =>
                  setPersonalMapForm((f) => ({ ...f, personal_map_notes: e.target.value }))
                }
                placeholder="Describe your map or what it represents..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPersonalMapDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => savePersonalMapMutation.mutate(personalMapForm)}
              disabled={savePersonalMapMutation.isPending}
            >
              {savePersonalMapMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Save Map
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
