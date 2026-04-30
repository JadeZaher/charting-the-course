import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RoleBadge } from "@/components/RoleBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Search, BookOpen, Users, ListChecks, Award,
  Shield, Loader2, Plus, Edit, Trash2, Eye, Upload, X, Image,
  UserPlus, UsersRound, ClipboardList, Mail, Send, CheckCircle,
  Globe, Building2, Network, UserMinus, Bot, MessageSquare, ToggleLeft, ToggleRight,
  Settings, Map as MapIcon
} from "lucide-react";
import { APP_SETTINGS_KEYS } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, Redirect, useLocation } from "wouter";
import { usePermissions, Permission, ALL_PERMISSIONS, PERMISSION_LABELS, PERMISSION_DESCRIPTIONS } from "@/hooks/usePermissions";
import { Checkbox } from "@/components/ui/checkbox";
import { fetchMembers, fetchQuizzes as apiFetchQuizzes, fetchEcosystems, createEcosystemRecord, updateEcosystemRecord } from "@/lib/api-client";

const BASE_URL = import.meta.env.VITE_API_URL || '';
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { credentials: 'include', ...options });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as any).error || res.statusText);
  }
  return res.json();
}
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

type Role = "Admin" | "Facilitator" | "Contributor" | "Viewer";

const getRoleBadgeRole = (role?: string): Role => {
  if (!role) return "Viewer";
  return (role.charAt(0).toUpperCase() + role.slice(1)) as Role;
};

// Fetch users from Sanic BFF API
async function fetchUsers() {
  const result = await fetchMembers();
  const items = (result as any).items || (result as any).members || [];
  return items.map((m: any) => ({
    id: m.id,
    first_name: m.display_name?.split(' ')[0] ?? null,
    last_name: m.display_name?.split(' ').slice(1).join(' ') ?? null,
    username: m.username ?? null,
    avatar_url: m.avatar_url ?? null,
    profile_visibility: m.profile_visibility ?? 'public',
    created_at: m.created_at,
    role: m.role ?? 'viewer',
    roleName: m.role_name ?? 'Viewer',
    permissions: (m.permissions as Permission[]) || [],
    isArchived: m.is_archived ?? false,
    did: m.did ?? null,
  }));
}

// Fetch quizzes via Sanic BFF API
async function fetchQuizzes() {
  const result = await apiFetchQuizzes();
  return (result as any).items || (result as any).quizzes || [];
}

// Fetch badge definitions — TODO: add endpoint to Sanic API
async function fetchBadges() {
  // TODO: Replace with Sanic API endpoint when badge definitions endpoint is implemented
  return [];
}

// Fetch teams — TODO: add teams endpoint to Sanic API
async function fetchTeams() {
  // TODO: Replace with Sanic API endpoint when teams endpoint is implemented
  return [];
}

// Fetch quiz assignments — TODO: add assignments endpoint to Sanic API
async function fetchAssignments() {
  // TODO: Replace with Sanic API endpoint when assignments endpoint is implemented
  return [];
}

interface BadgeFormData {
  badge_key: string;
  badge_name: string;
  badge_description: string;
  badge_category: string;
  badge_icon: string; // emoji or image URL
  badge_color: string;
  xp_reward: number;
  is_active: boolean;
  is_featured: boolean;
}

// Check if badge icon is an emoji or URL
const isEmojiIcon = (icon: string | null): boolean => {
  if (!icon) return true;
  return !icon.startsWith('http') && !icon.startsWith('/');
};

// Upload badge icon — TODO: implement file upload endpoint in Sanic API
async function uploadBadgeIcon(_file: File, _badgeKey: string): Promise<string> {
  // TODO: Replace with Sanic API endpoint when badge icon upload is implemented
  throw new Error('Badge icon upload is not yet available on the Sanic API.');
}

export default function AdminPanel() {
  // All hooks must be called at the top, before any conditional returns
  const { isAdmin, canManageUsers, canManageContent, isLoading: roleLoading } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  // State hooks
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newRole, setNewRole] = useState("");
  const [editedPermissions, setEditedPermissions] = useState<Permission[]>([]);
  const [isEditPermissionsOpen, setIsEditPermissionsOpen] = useState(false);
  const [isCreateBadgeOpen, setIsCreateBadgeOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<any>(null);
  const [iconType, setIconType] = useState<'emoji' | 'image'>('emoji');
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [badgeForm, setBadgeForm] = useState<BadgeFormData>({
    badge_key: '',
    badge_name: '',
    badge_description: '',
    badge_category: 'achievement',
    badge_icon: '🏅',
    badge_color: '#6366F1',
    xp_reward: 50,
    is_active: true,
    is_featured: false,
  });

  // Team management state
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [teamForm, setTeamForm] = useState({ name: '', description: '' });
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);

  // Assignment state
  const [isAssignQuizOpen, setIsAssignQuizOpen] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    quiz_id: '',
    user_ids: [] as string[],
    team_id: '',
    due_date: '',
  });

  // Create user state
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'viewer',
  });

  // ETHOS management state
  const [isEthosDialogOpen, setIsEthosDialogOpen] = useState(false);
  const [editingEthos, setEditingEthos] = useState<any>(null);
  const [ethosDeleteTarget, setEthosDeleteTarget] = useState<any>(null);
  const [ethosHardDeleteTarget, setEthosHardDeleteTarget] = useState<any>(null);
  const [ethosUserSearch, setEthosUserSearch] = useState("");
  const [ethosUserResults, setEthosUserResults] = useState<any[]>([]);
  const [memberForm, setMemberForm] = useState({ user_id: "", role_in_ethos: "member", member_type: "member" });
  const defaultEthosForm = {
    name: "", slug: "", tagline: "", sector: "", ethos_type: "team",
    description: "", mission: "", external_url: "", image_url: "",
    parent_ethos_id: "", is_public: true, is_active: true,
    phase: "forming", map_url: "", map_type: "image", map_title: "",
    external_links: [] as { label: string; url: string }[],
  };
  const [ethosForm, setEthosForm] = useState(defaultEthosForm);
  const [accessEthos, setAccessEthos] = useState<any>(null);
  const [isAccessDialogOpen, setIsAccessDialogOpen] = useState(false);
  const [accessUserSearch, setAccessUserSearch] = useState("");
  const [accessUserResults, setAccessUserResults] = useState<any[]>([]);

  // OmniBot session history state
  const [selectedOmnibotSession, setSelectedOmnibotSession] = useState<any>(null);
  const [omnibotSessionTypeFilter, setOmnibotSessionTypeFilter] = useState("all");
  const [omnibotSearch, setOmnibotSearch] = useState("");

  // Settings tab state
  const [ctcMapForm, setCtcMapForm] = useState({ prezi_url: "", description: "" });
  const [ctcMapLoaded, setCtcMapLoaded] = useState(false);
  const [savingCtcMap, setSavingCtcMap] = useState(false);

  // Query hooks - must be called before any conditional returns
  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: fetchUsers,
    enabled: isAdmin || canManageUsers,
  });

  const { data: quizzes = [], isLoading: quizzesLoading } = useQuery({
    queryKey: ['admin-quizzes'],
    queryFn: fetchQuizzes,
    enabled: isAdmin || canManageUsers,
  });

  const { data: badges = [], isLoading: badgesLoading } = useQuery({
    queryKey: ['admin-badges'],
    queryFn: fetchBadges,
    enabled: isAdmin || canManageUsers,
  });

  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['admin-teams'],
    queryFn: fetchTeams,
    enabled: isAdmin || canManageUsers,
  });

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ['admin-assignments'],
    queryFn: fetchAssignments,
    enabled: isAdmin || canManageUsers,
  });

  // ETHOS query via Sanic BFF API
  const { data: ethosListData = [], isLoading: ethosLoading, refetch: refetchEthos } = useQuery({
    queryKey: ['admin-ethos'],
    queryFn: async () => {
      const result = await fetchEcosystems();
      return (result as any).ecosystems || (result as any).items || [];
    },
    enabled: isAdmin || canManageContent,
  });

  // ETHOS members query — TODO: add per-ecosystem members endpoint to Sanic API
  const { data: ethosMembers = [], refetch: refetchEthosMembers } = useQuery({
    queryKey: ['admin-ethos-members', editingEthos?.id],
    queryFn: async () => {
      if (!editingEthos?.id) return [];
      // TODO: Replace with Sanic API endpoint when ecosystem members endpoint is implemented
      return [];
    },
    enabled: !!editingEthos?.id,
  });

  // ETHOS access grants query
  const { data: ethosAccessGrants = [], refetch: refetchAccessGrants } = useQuery({
    queryKey: ['admin-ethos-access', accessEthos?.id],
    queryFn: async () => {
      if (!accessEthos?.id) return [];
      // TODO: GET /api/v1/admin/ecosystems/:id/access — no NEOS Den endpoint yet
      return [];
    },
    enabled: !!accessEthos?.id,
  });

  // OmniBot sessions query — TODO: add OmniBot sessions endpoint to Sanic API
  const { data: omnibotSessions = [], isLoading: omnibotLoading } = useQuery({
    queryKey: ['admin-omnibot-sessions'],
    queryFn: async () => {
      // TODO: Replace with Sanic API endpoint when OmniBot sessions endpoint is implemented
      return [];
    },
    enabled: isAdmin,
  });

  // CTC handoff ready flags query
  const { data: handoffData = [] } = useQuery({
    queryKey: ['admin-ctc-handoff'],
    queryFn: async () => {
      // TODO: ctc_handoff is in Supabase — needs a NEOS Den proxy endpoint
      return [];
    },
    enabled: (isAdmin || canManageUsers) && users.length > 0,
  });

  const handoffMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const row of (handoffData as any[])) {
      map[row.user_id] = row.ready_for_neos_den ?? false;
    }
    return map;
  }, [handoffData]);

  // CTC Map settings query — TODO: add settings endpoint to Sanic API
  const { data: ctcMapData } = useQuery({
    queryKey: ['admin-ctc-map-settings'],
    queryFn: async () => {
      // TODO: Replace with Sanic API endpoint when settings endpoint is implemented
      return { prezi_url: "", description: "" };
    },
    enabled: !!(isAdmin || canManageContent),
  });
  useEffect(() => {
    if (ctcMapData && !ctcMapLoaded) {
      setCtcMapForm({ prezi_url: ctcMapData.prezi_url || "", description: ctcMapData.description || "" });
      setCtcMapLoaded(true);
    }
  }, [ctcMapData]);

  const saveCtcMapSettings = async () => {
    setSavingCtcMap(true);
    try {
      // TODO: Replace with Sanic API endpoint when settings endpoint is implemented
      await apiFetch('/api/v1/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: APP_SETTINGS_KEYS.ctcMap, value: ctcMapForm }),
      });
      queryClient.invalidateQueries({ queryKey: ['admin-ctc-map-settings'] });
      queryClient.invalidateQueries({ queryKey: ['ctc-map-settings'] });
      toast({ title: "Map settings saved!" });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSavingCtcMap(false);
    }
  };

  // Badge mutations — TODO: add badge endpoints to Sanic API
  const createBadgeMutation = useMutation({
    mutationFn: async (_data: BadgeFormData) => {
      // TODO: Replace with Sanic API endpoint when badge management is implemented
      throw new Error('Badge creation not yet available on the Sanic API');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-badges'] });
      setIsCreateBadgeOpen(false);
      resetBadgeForm();
      toast({ title: "Badge Created", description: "New badge has been created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateBadgeMutation = useMutation({
    mutationFn: async (_params: { id: string; data: Partial<BadgeFormData> }) => {
      // TODO: Replace with Sanic API endpoint when badge management is implemented
      throw new Error('Badge update not yet available on the Sanic API');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-badges'] });
      setEditingBadge(null);
      resetBadgeForm();
      toast({ title: "Badge Updated", description: "Badge has been updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteBadgeMutation = useMutation({
    mutationFn: async (_id: string) => {
      // TODO: Replace with Sanic API endpoint when badge management is implemented
      throw new Error('Badge deletion not yet available on the Sanic API');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-badges'] });
      toast({ title: "Badge Deleted", description: "Badge has been deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Team mutations — TODO: add teams endpoints to Sanic API
  const createTeamMutation = useMutation({
    mutationFn: async (_data: { name: string; description: string; member_ids: string[] }) => {
      // TODO: Replace with Sanic API endpoint when teams endpoint is implemented
      throw new Error('Team creation not yet available on the Sanic API');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teams'] });
      setIsCreateTeamOpen(false);
      setTeamForm({ name: '', description: '' });
      setSelectedTeamMembers([]);
      toast({ title: "Team Created", description: "New team has been created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (_id: string) => {
      // TODO: Replace with Sanic API endpoint when teams endpoint is implemented
      throw new Error('Team deletion not yet available on the Sanic API');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teams'] });
      toast({ title: "Team Deleted", description: "Team has been deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // ETHOS mutations via Sanic BFF API
  const createEthosMutation = useMutation({
    mutationFn: async (data: typeof defaultEthosForm) => {
      return createEcosystemRecord({ ...data, parent_ethos_id: data.parent_ethos_id || null });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-ethos'] });
      setEditingEthos(data);
      toast({ title: "ETHOS Created", description: "New ETHOS has been created. Add members below." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateEthosMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof defaultEthosForm> }) => {
      return updateEcosystemRecord(id, { ...data, parent_ethos_id: data.parent_ethos_id || null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ethos'] });
      toast({ title: "ETHOS Updated", description: "Changes saved." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteEthosMutation = useMutation({
    mutationFn: async ({ id, hard }: { id: string; hard: boolean }) => {
      return apiFetch<any>(`/api/v1/ecosystems/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hard }),
      });
    },
    onSuccess: (_, { hard }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-ethos'] });
      setEthosDeleteTarget(null);
      setEthosHardDeleteTarget(null);
      if (editingEthos?.id === ethosDeleteTarget?.id || editingEthos?.id === ethosHardDeleteTarget?.id) {
        setEditingEthos(null);
        setIsEthosDialogOpen(false);
      }
      toast({ title: hard ? "ETHOS Deleted" : "ETHOS Deactivated", description: hard ? "ETHOS permanently removed." : "ETHOS set to inactive." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const addEthosMemberMutation = useMutation({
    mutationFn: async (data: { ethos_id: string; user_id: string; role_in_ethos: string; member_type: string }) => {
      return apiFetch<any>(`/api/v1/ecosystems/${data.ethos_id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      refetchEthosMembers();
      setMemberForm({ user_id: "", role_in_ethos: "member", member_type: "member" });
      setEthosUserSearch("");
      setEthosUserResults([]);
      toast({ title: "Member Added" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const removeEthosMemberMutation = useMutation({
    mutationFn: async ({ ethos_id, user_id }: { ethos_id: string; user_id: string }) => {
      return apiFetch<any>(`/api/v1/ecosystems/${ethos_id}/members/${user_id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      refetchEthosMembers();
      toast({ title: "Member Removed" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const searchEthosUsers = async (query: string) => {
    if (!query || query.length < 2) { setEthosUserResults([]); return; }
    try {
      const result = await fetchMembers({ search: query, limit: '10' });
      const members = (result as any).items || (result as any).members || [];
      setEthosUserResults(members.map((m: any) => ({
        id: m.id,
        display_name: m.display_name,
        did: m.did,
      })));
    } catch {
      setEthosUserResults([]);
    }
  };

  const searchAccessUsers = async (query: string) => {
    if (!query || query.length < 2) { setAccessUserResults([]); return; }
    try {
      const result = await fetchMembers({ search: query, limit: '10' });
      const members = (result as any).items || (result as any).members || [];
      setAccessUserResults(members.map((m: any) => ({
        id: m.id,
        display_name: m.display_name,
        did: m.did,
      })));
    } catch {
      setAccessUserResults([]);
    }
  };

  const grantAccessMutation = useMutation({
    mutationFn: async ({ ethos_id, user_id }: { ethos_id: string; user_id: string }) => {
      // TODO: POST /api/v1/admin/ecosystems/:id/access — no NEOS Den endpoint yet
      throw new Error('Ethos access management requires a NEOS Den endpoint');
    },
    onSuccess: () => {
      refetchAccessGrants();
      setAccessUserSearch('');
      setAccessUserResults([]);
      toast({ title: 'Access Granted' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const revokeAccessMutation = useMutation({
    mutationFn: async ({ ethos_id, user_id }: { ethos_id: string; user_id: string }) => {
      // TODO: DELETE /api/v1/admin/ecosystems/:id/access/:user_id — no NEOS Den endpoint yet
      throw new Error('Ethos access management requires a NEOS Den endpoint');
    },
    onSuccess: () => {
      refetchAccessGrants();
      toast({ title: 'Access Revoked' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const openCreateEthos = () => {
    setEditingEthos(null);
    setEthosForm(defaultEthosForm);
    setIsEthosDialogOpen(true);
  };

  const openEditEthos = (ethos: any) => {
    setEditingEthos(ethos);
    setEthosForm({
      name: ethos.name || "",
      slug: ethos.slug || "",
      tagline: ethos.tagline || "",
      sector: ethos.sector || "",
      ethos_type: ethos.ethos_type || "team",
      description: ethos.description || "",
      mission: ethos.mission || "",
      external_url: ethos.external_url || "",
      image_url: ethos.image_url || "",
      parent_ethos_id: ethos.parent_ethos_id || "",
      is_public: ethos.is_public ?? true,
      is_active: ethos.is_active ?? true,
      phase: ethos.phase || "forming",
      map_url: ethos.map_url || "",
      map_type: ethos.map_type || "image",
      map_title: ethos.map_title || "",
      external_links: Array.isArray(ethos.external_links) ? ethos.external_links : [],
    });
    setIsEthosDialogOpen(true);
  };

  const handleSaveEthos = () => {
    if (!ethosForm.name || !ethosForm.slug) {
      toast({ title: "Error", description: "Name and slug are required", variant: "destructive" });
      return;
    }
    if (editingEthos?.id) {
      updateEthosMutation.mutate({ id: editingEthos.id, data: ethosForm });
    } else {
      createEthosMutation.mutate(ethosForm);
    }
  };

  // Quiz assignment mutations
  const assignQuizMutation = useMutation({
    mutationFn: async (data: { quiz_id: string; user_ids: string[]; team_id?: string; due_date?: string }) => {
      const assignments = [];
      
      // Assign to individual users
      for (const userId of data.user_ids) {
        assignments.push({
          quiz_id: data.quiz_id,
          user_id: userId,
          due_date: data.due_date || null,
        });
      }
      
      // Assign to team (will assign to all team members)
      if (data.team_id) {
        assignments.push({
          quiz_id: data.quiz_id,
          team_id: data.team_id,
          due_date: data.due_date || null,
        });
      }
      
      if (assignments.length === 0) {
        throw new Error('Please select at least one user or team');
      }

      // TODO: Replace with Sanic API endpoint when quiz assignments endpoint is implemented
      await apiFetch('/api/v1/quiz-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-assignments'] });
      setIsAssignQuizOpen(false);
      setAssignmentForm({ quiz_id: '', user_ids: [], team_id: '', due_date: '' });
      toast({ title: "Quiz Assigned", description: "Quiz has been assigned successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: async (id: string) => {
      // TODO: Replace with Sanic API endpoint when quiz assignments endpoint is implemented
      await apiFetch(`/api/v1/quiz-assignments/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-assignments'] });
      toast({ title: "Assignment Removed", description: "Quiz assignment has been removed" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Create user mutation via Sanic BFF API
  const createUserMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; first_name: string; last_name: string; role: string }) => {
      // TODO: Replace with Sanic API invite/create-member endpoint when implemented
      return apiFetch<any>('/api/v1/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: `${data.first_name} ${data.last_name}`.trim(),
          email: data.email,
          role: data.role,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsCreateUserOpen(false);
      setCreateUserForm({ email: '', password: '', first_name: '', last_name: '', role: 'viewer' });
      toast({ title: "User Created", description: "New user has been created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // NEOS Den ready toggle mutation
  const setNeosDenReadyMutation = useMutation({
    mutationFn: async ({ user_id, did, ready_for_neos_den }: { user_id: string; did: string; ready_for_neos_den: boolean }) => {
      return await apiFetch('/api/v1/admin/ctc/set-neos-den-ready', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ did, ready: ready_for_neos_den }),
      });
    },
    onMutate: async ({ user_id, ready_for_neos_den }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-ctc-handoff'] });
      const previous = queryClient.getQueryData(['admin-ctc-handoff']);
      queryClient.setQueryData(['admin-ctc-handoff'], (old: any) => {
        const rows: any[] = old ?? [];
        const exists = rows.some((r: any) => r.user_id === user_id);
        if (exists) {
          return rows.map((r: any) => r.user_id === user_id ? { ...r, ready_for_neos_den } : r);
        }
        return [...rows, { user_id, ready_for_neos_den }];
      });
      return { previous };
    },
    onError: (_err: any, _vars: any, context: any) => {
      queryClient.setQueryData(['admin-ctc-handoff'], context?.previous);
      toast({ title: 'Failed to update NEOS Den status', variant: 'destructive' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ctc-handoff'] });
    },
  });

  // Check access - conditional returns AFTER all hooks
  if (roleLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin && !canManageUsers) {
    return <Redirect to="/" />;
  }

  const resetBadgeForm = () => {
    setBadgeForm({
      badge_key: '',
      badge_name: '',
      badge_description: '',
      badge_category: 'achievement',
      badge_icon: '🏅',
      badge_color: '#6366F1',
      xp_reward: 50,
      is_active: true,
      is_featured: false,
    });
    setIconType('emoji');
    setIconFile(null);
    setIconPreview(null);
  };

  const handleIconFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
        return;
      }
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({ title: "Error", description: "Image must be less than 2MB", variant: "destructive" });
        return;
      }
      setIconFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setIconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearIconFile = () => {
    setIconFile(null);
    setIconPreview(null);
  };

  const handleCreateBadge = async () => {
    if (!badgeForm.badge_key || !badgeForm.badge_name) {
      toast({ title: "Error", description: "Badge key and name are required", variant: "destructive" });
      return;
    }

    let iconValue = badgeForm.badge_icon;

    // If using image and file is selected, upload it first
    if (iconType === 'image' && iconFile) {
      try {
        setIsUploading(true);
        iconValue = await uploadBadgeIcon(iconFile, badgeForm.badge_key);
      } catch (error: any) {
        toast({ title: "Upload Error", description: error.message, variant: "destructive" });
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    createBadgeMutation.mutate({ ...badgeForm, badge_icon: iconValue });
  };

  const handleUpdateBadge = async () => {
    if (!editingBadge) return;

    let iconValue = badgeForm.badge_icon;

    // If using image and new file is selected, upload it first
    if (iconType === 'image' && iconFile) {
      try {
        setIsUploading(true);
        iconValue = await uploadBadgeIcon(iconFile, badgeForm.badge_key);
      } catch (error: any) {
        toast({ title: "Upload Error", description: error.message, variant: "destructive" });
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    updateBadgeMutation.mutate({ id: editingBadge.id, data: { ...badgeForm, badge_icon: iconValue } });
  };

  const handleDeleteBadge = async (badge: any) => {
    if (!confirm(`Are you sure you want to delete "${badge.badge_name}"?`)) return;
    deleteBadgeMutation.mutate(badge.id);
  };

  const openEditBadge = (badge: any) => {
    setEditingBadge(badge);
    const isEmoji = isEmojiIcon(badge.badge_icon);
    setIconType(isEmoji ? 'emoji' : 'image');
    setIconFile(null);
    setIconPreview(isEmoji ? null : badge.badge_icon);
    setBadgeForm({
      badge_key: badge.badge_key,
      badge_name: badge.badge_name,
      badge_description: badge.badge_description || '',
      badge_category: badge.badge_category || 'achievement',
      badge_icon: badge.badge_icon || '🏅',
      badge_color: badge.badge_color || '#6366F1',
      xp_reward: badge.xp_reward || 50,
      is_active: badge.is_active ?? true,
      is_featured: badge.is_featured ?? false,
    });
  };

  const filteredUsers = users.filter(
    (user: any) =>
      (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.first_name && user.first_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.last_name && user.last_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeQuizzes = quizzes.filter((q: any) => q.is_published);
  const quizCreators = users.filter((u: any) => u.role === "admin" || u.role === "facilitator");

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) return;

    try {
      // TODO: replace with dedicated Sanic role assignment endpoint when available
      await apiFetch(`/api/v1/members/${selectedUser.id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      toast({
        title: "Role Updated",
        description: `${selectedUser.first_name || selectedUser.username}'s role has been changed to ${newRole}`,
      });

      refetchUsers();
      setSelectedUser(null);
      setNewRole("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update role",
        variant: "destructive",
      });
    }
  };

  const handlePermissionsChange = async () => {
    if (!selectedUser) return;

    try {
      // TODO: replace with dedicated Sanic permissions endpoint when available
      await apiFetch(`/api/v1/members/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: editedPermissions }),
      });

      toast({
        title: "Permissions Updated",
        description: `${selectedUser.first_name || selectedUser.username}'s permissions have been updated`,
      });

      refetchUsers();
      setIsEditPermissionsOpen(false);
      setSelectedUser(null);
      setEditedPermissions([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update permissions",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Admin Control Panel
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage users, quizzes, badges, and platform statistics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold" data-testid="stat-total-users">
                  {users.length}
                </div>
                <div className="text-sm text-muted-foreground">Total Users</div>
              </div>
              <Users className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold" data-testid="stat-active-quizzes">
                  {activeQuizzes.length}
                </div>
                <div className="text-sm text-muted-foreground">Published Quizzes</div>
              </div>
              <ListChecks className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold" data-testid="stat-total-quizzes">
                  {quizzes.length}
                </div>
                <div className="text-sm text-muted-foreground">Total Quizzes</div>
              </div>
              <BookOpen className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold" data-testid="stat-badges">
                  {badges.length}
                </div>
                <div className="text-sm text-muted-foreground">Badge Definitions</div>
              </div>
              <Award className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users">
        <TabsList className="flex-wrap">
          <TabsTrigger value="users" data-testid="tab-users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="teams" data-testid="tab-teams">
            <UsersRound className="h-4 w-4 mr-2" />
            Teams
          </TabsTrigger>
          <TabsTrigger value="quizzes" data-testid="tab-quizzes">
            <BookOpen className="h-4 w-4 mr-2" />
            Quizzes
          </TabsTrigger>
          <TabsTrigger value="assignments" data-testid="tab-assignments">
            <ClipboardList className="h-4 w-4 mr-2" />
            Assignments
          </TabsTrigger>
          <TabsTrigger value="badges" data-testid="tab-badges">
            <Award className="h-4 w-4 mr-2" />
            Badges
          </TabsTrigger>
          {(isAdmin || canManageContent) && (
            <TabsTrigger value="ethos" data-testid="tab-ethos">
              <Globe className="h-4 w-4 mr-2" />
              ETHOS
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="omnibot" data-testid="tab-omnibot">
              <Bot className="h-4 w-4 mr-2" />
              OmniBot
            </TabsTrigger>
          )}
          {(isAdmin || canManageContent) && (
            <TabsTrigger value="settings" data-testid="tab-settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          )}
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage user accounts and roles</CardDescription>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                      data-testid="input-search-users"
                    />
                  </div>
                  <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Create User
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New User</DialogTitle>
                        <DialogDescription>Add a new user to the platform</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>First Name</Label>
                            <Input
                              value={createUserForm.first_name}
                              onChange={(e) => setCreateUserForm(f => ({ ...f, first_name: e.target.value }))}
                              placeholder="John"
                            />
                          </div>
                          <div>
                            <Label>Last Name</Label>
                            <Input
                              value={createUserForm.last_name}
                              onChange={(e) => setCreateUserForm(f => ({ ...f, last_name: e.target.value }))}
                              placeholder="Doe"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={createUserForm.email}
                            onChange={(e) => setCreateUserForm(f => ({ ...f, email: e.target.value }))}
                            placeholder="john@example.com"
                          />
                        </div>
                        <div>
                          <Label>Password</Label>
                          <Input
                            type="password"
                            value={createUserForm.password}
                            onChange={(e) => setCreateUserForm(f => ({ ...f, password: e.target.value }))}
                            placeholder="Minimum 6 characters"
                          />
                        </div>
                        <div>
                          <Label>Role</Label>
                          <Select
                            value={createUserForm.role}
                            onValueChange={(v) => setCreateUserForm(f => ({ ...f, role: v }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="viewer">Viewer</SelectItem>
                              <SelectItem value="contributor">Contributor</SelectItem>
                              <SelectItem value="facilitator">Facilitator</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button 
                          onClick={() => createUserMutation.mutate(createUserForm)}
                          disabled={createUserMutation.isPending || !createUserForm.email || !createUserForm.password}
                          className="w-full"
                        >
                          {createUserMutation.isPending ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</>
                          ) : (
                            <><UserPlus className="h-4 w-4 mr-2" /> Create User</>
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredUsers.length > 0 ? (
                <div className="space-y-3">
                  {filteredUsers.map((user: any) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                      data-testid={`user-row-${user.id}`}
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <p className="font-medium truncate">
                            {user.first_name || user.last_name 
                              ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                              : user.username || 'Unknown'}
                          </p>
                          <RoleBadge role={getRoleBadgeRole(user.role)} />
                          {(user.role === "admin" || user.role === "facilitator") && (
                            <Badge variant="outline">Quiz Creator</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          @{user.username} • {user.profile_visibility} profile
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={handoffMap[user.id] ?? false}
                            onCheckedChange={(checked) =>
                              setNeosDenReadyMutation.mutate({ user_id: user.id, did: (user as any).did || '', ready_for_neos_den: checked })
                            }
                          />
                          <span className="text-sm text-muted-foreground whitespace-nowrap">NEOS Den</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setEditedPermissions(user.permissions || []);
                            setIsEditPermissionsOpen(true);
                          }}
                          data-testid={`button-edit-permissions-${user.id}`}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit Permissions
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  {searchQuery ? "No users match your search" : "No users found"}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Single Edit Permissions Dialog - outside the map for proper state management */}
          <Dialog 
            open={isEditPermissionsOpen} 
            onOpenChange={(open) => {
              setIsEditPermissionsOpen(open);
              if (!open) {
                setSelectedUser(null);
                setEditedPermissions([]);
              }
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit User Permissions</DialogTitle>
                <DialogDescription>
                  Update permissions for {selectedUser?.first_name || selectedUser?.username || 'user'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-3">
                  {ALL_PERMISSIONS.map((permission) => (
                    <div key={permission} className="flex items-start gap-3">
                      <Checkbox
                        id={`perm-dialog-${permission}`}
                        checked={editedPermissions.includes(permission)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEditedPermissions(prev => [...prev, permission]);
                          } else {
                            setEditedPermissions(prev => prev.filter(p => p !== permission));
                          }
                        }}
                        data-testid={`checkbox-permission-${permission}`}
                      />
                      <div className="flex-1">
                        <Label 
                          htmlFor={`perm-dialog-${permission}`}
                          className="font-medium cursor-pointer"
                        >
                          {PERMISSION_LABELS[permission]}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {PERMISSION_DESCRIPTIONS[permission]}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button onClick={handlePermissionsChange} className="w-full">
                  Update Permissions
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle>Team Management</CardTitle>
                  <CardDescription>Create and manage teams</CardDescription>
                </div>
                <Dialog open={isCreateTeamOpen} onOpenChange={setIsCreateTeamOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Team
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Team</DialogTitle>
                      <DialogDescription>Create a team and add members</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Team Name</Label>
                        <Input
                          value={teamForm.name}
                          onChange={(e) => setTeamForm(f => ({ ...f, name: e.target.value }))}
                          placeholder="e.g., Marketing Team"
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={teamForm.description}
                          onChange={(e) => setTeamForm(f => ({ ...f, description: e.target.value }))}
                          placeholder="Team description..."
                        />
                      </div>
                      <div>
                        <Label>Add Members</Label>
                        <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                          {users.map((user: any) => (
                            <label key={user.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded">
                              <input
                                type="checkbox"
                                checked={selectedTeamMembers.includes(user.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedTeamMembers(m => [...m, user.id]);
                                  } else {
                                    setSelectedTeamMembers(m => m.filter(id => id !== user.id));
                                  }
                                }}
                                className="rounded"
                              />
                              <span>{user.first_name} {user.last_name}</span>
                              <span className="text-muted-foreground text-sm">@{user.username}</span>
                            </label>
                          ))}
                        </div>
                        {selectedTeamMembers.length > 0 && (
                          <p className="text-sm text-muted-foreground mt-2">{selectedTeamMembers.length} member(s) selected</p>
                        )}
                      </div>
                      <Button 
                        onClick={() => createTeamMutation.mutate({ 
                          ...teamForm, 
                          member_ids: selectedTeamMembers 
                        })}
                        disabled={createTeamMutation.isPending || !teamForm.name}
                        className="w-full"
                      >
                        {createTeamMutation.isPending ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</>
                        ) : (
                          <><Plus className="h-4 w-4 mr-2" /> Create Team</>
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {teamsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : teams.length > 0 ? (
                <div className="space-y-3">
                  {teams.map((team: any) => (
                    <div key={team.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <UsersRound className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{team.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {team.team_members?.length || 0} member(s)
                            {team.description && ` • ${team.description}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTeamMutation.mutate(team.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <UsersRound className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>No teams created yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quizzes Tab */}
        <TabsContent value="quizzes" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle>Quiz Management</CardTitle>
                  <CardDescription>View and manage all quizzes</CardDescription>
                </div>
                <Link href="/quiz/manage">
                  <Button data-testid="button-manage-quizzes">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Quiz
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {quizzesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : quizzes.length > 0 ? (
                <div className="space-y-3">
                  {quizzes.map((quiz: any) => (
                    <div
                      key={quiz.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                      data-testid={`quiz-row-${quiz.id}`}
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <p className="font-medium truncate">{quiz.title}</p>
                          <Badge variant={quiz.is_published ? "default" : "outline"}>
                            {quiz.is_published ? "Published" : "Draft"}
                          </Badge>
                          <Badge variant="secondary">{quiz.visibility}</Badge>
                        </div>
                        {quiz.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {quiz.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            console.log('Viewing quiz from admin panel:', quiz.id);
                            setLocation(`/quiz/take/${quiz.id}`);
                          }}
                          title="View/Preview Quiz"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            console.log('Editing quiz from admin panel:', quiz.id);
                            setLocation(`/quiz/manage?edit=${quiz.id}`);
                          }}
                          title="Edit Quiz"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No quizzes created yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle>Quiz Assignments</CardTitle>
                  <CardDescription>Assign quizzes to users and teams</CardDescription>
                </div>
                <Dialog open={isAssignQuizOpen} onOpenChange={setIsAssignQuizOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Send className="h-4 w-4 mr-2" />
                      Assign Quiz
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Assign Quiz</DialogTitle>
                      <DialogDescription>Assign a quiz to users or teams</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Select Quiz</Label>
                        <Select
                          value={assignmentForm.quiz_id}
                          onValueChange={(v) => setAssignmentForm(f => ({ ...f, quiz_id: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a quiz..." />
                          </SelectTrigger>
                          <SelectContent>
                            {quizzes.filter((q: any) => q.is_published).map((quiz: any) => (
                              <SelectItem key={quiz.id} value={quiz.id}>
                                {quiz.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Assign to Team (Optional)</Label>
                        <Select
                          value={assignmentForm.team_id || "none"}
                          onValueChange={(v) => setAssignmentForm(f => ({ ...f, team_id: v === "none" ? "" : v }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a team..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No team (individual only)</SelectItem>
                            {teams.map((team: any) => (
                              <SelectItem key={team.id} value={team.id}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Assign to Individual Users</Label>
                        <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                          {users.map((user: any) => (
                            <label key={user.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded">
                              <input
                                type="checkbox"
                                checked={assignmentForm.user_ids.includes(user.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setAssignmentForm(f => ({ ...f, user_ids: [...f.user_ids, user.id] }));
                                  } else {
                                    setAssignmentForm(f => ({ ...f, user_ids: f.user_ids.filter(id => id !== user.id) }));
                                  }
                                }}
                                className="rounded"
                              />
                              <span>{user.first_name} {user.last_name}</span>
                              <RoleBadge role={getRoleBadgeRole(user.role)} className="text-xs ml-auto" />
                            </label>
                          ))}
                        </div>
                        {assignmentForm.user_ids.length > 0 && (
                          <p className="text-sm text-muted-foreground mt-2">{assignmentForm.user_ids.length} user(s) selected</p>
                        )}
                      </div>
                      <div>
                        <Label>Due Date (Optional)</Label>
                        <Input
                          type="date"
                          value={assignmentForm.due_date}
                          onChange={(e) => setAssignmentForm(f => ({ ...f, due_date: e.target.value }))}
                        />
                      </div>
                      <Button 
                        onClick={() => assignQuizMutation.mutate(assignmentForm)}
                        disabled={assignQuizMutation.isPending || !assignmentForm.quiz_id || (assignmentForm.user_ids.length === 0 && !assignmentForm.team_id)}
                        className="w-full"
                      >
                        {assignQuizMutation.isPending ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Assigning...</>
                        ) : (
                          <><Send className="h-4 w-4 mr-2" /> Assign Quiz</>
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {assignmentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : assignments.length > 0 ? (
                <div className="space-y-3">
                  {assignments.map((assignment: any) => (
                    <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <ClipboardList className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="font-medium">{assignment.quiz?.title || 'Unknown Quiz'}</p>
                          <p className="text-sm text-muted-foreground">
                            {assignment.user ? (
                              <>Assigned to {assignment.user.first_name} {assignment.user.last_name}</>
                            ) : assignment.team ? (
                              <>Assigned to team: {assignment.team.name}</>
                            ) : (
                              'Unknown assignment'
                            )}
                            {assignment.due_date && (
                              <> • Due: {new Date(assignment.due_date).toLocaleDateString()}</>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAssignmentMutation.mutate(assignment.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardList className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>No quiz assignments yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value="badges" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle>Badge Management</CardTitle>
                  <CardDescription>Create and manage badge definitions ({badges.length} badges)</CardDescription>
                </div>
                <Dialog open={isCreateBadgeOpen} onOpenChange={setIsCreateBadgeOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-create-badge" onClick={() => { resetBadgeForm(); setIsCreateBadgeOpen(true); }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Badge
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Create New Badge</DialogTitle>
                      <DialogDescription>
                        Define a new badge that users can earn
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4 max-h-[60vh] overflow-y-auto">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Badge Key *</Label>
                          <Input 
                            placeholder="e.g., quiz_master" 
                            value={badgeForm.badge_key}
                            onChange={(e) => setBadgeForm({...badgeForm, badge_key: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Badge Name *</Label>
                          <Input 
                            placeholder="e.g., Quiz Master" 
                            value={badgeForm.badge_name}
                            onChange={(e) => setBadgeForm({...badgeForm, badge_name: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea 
                          placeholder="Describe how to earn this badge..." 
                          value={badgeForm.badge_description}
                          onChange={(e) => setBadgeForm({...badgeForm, badge_description: e.target.value})}
                        />
                      </div>
                      <div className="space-y-3">
                        <Label>Icon Type</Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={iconType === 'emoji' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => { setIconType('emoji'); clearIconFile(); }}
                          >
                            😀 Emoji
                          </Button>
                          <Button
                            type="button"
                            variant={iconType === 'image' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setIconType('image')}
                          >
                            <Image className="h-4 w-4 mr-1" /> Image
                          </Button>
                        </div>
                        
                        {iconType === 'emoji' ? (
                          <div className="space-y-2">
                            <Label>Emoji Icon</Label>
                            <Input 
                              placeholder="🏅" 
                              value={badgeForm.badge_icon}
                              onChange={(e) => setBadgeForm({...badgeForm, badge_icon: e.target.value})}
                              className="text-2xl"
                            />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Label>Upload Image</Label>
                            {iconPreview ? (
                              <div className="flex items-center gap-3">
                                <img 
                                  src={iconPreview} 
                                  alt="Badge icon preview" 
                                  className="h-16 w-16 rounded-lg object-cover border"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={clearIconFile}
                                >
                                  <X className="h-4 w-4 mr-1" /> Remove
                                </Button>
                              </div>
                            ) : (
                              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleIconFileChange}
                                  className="hidden"
                                  id="badge-icon-upload"
                                />
                                <label 
                                  htmlFor="badge-icon-upload" 
                                  className="cursor-pointer flex flex-col items-center gap-2"
                                >
                                  <Upload className="h-8 w-8 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">
                                    Click to upload (max 2MB)
                                  </span>
                                </label>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Badge Color</Label>
                        <div className="flex gap-2">
                          <Input 
                            type="color" 
                            value={badgeForm.badge_color}
                            onChange={(e) => setBadgeForm({...badgeForm, badge_color: e.target.value})}
                            className="w-12 h-10 p-1"
                          />
                          <Input 
                            value={badgeForm.badge_color}
                            onChange={(e) => setBadgeForm({...badgeForm, badge_color: e.target.value})}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Select value={badgeForm.badge_category} onValueChange={(v) => setBadgeForm({...badgeForm, badge_category: v})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="achievement">Achievement</SelectItem>
                              <SelectItem value="score">Score</SelectItem>
                              <SelectItem value="trait">Trait</SelectItem>
                              <SelectItem value="special">Special</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>XP Reward</Label>
                          <Input 
                            type="number" 
                            value={badgeForm.xp_reward}
                            onChange={(e) => setBadgeForm({...badgeForm, xp_reward: parseInt(e.target.value) || 0})}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={badgeForm.is_active}
                            onChange={(e) => setBadgeForm({...badgeForm, is_active: e.target.checked})}
                            className="rounded"
                          />
                          <span className="text-sm">Active</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={badgeForm.is_featured}
                            onChange={(e) => setBadgeForm({...badgeForm, is_featured: e.target.checked})}
                            className="rounded"
                          />
                          <span className="text-sm">Featured</span>
                        </label>
                      </div>
                      <Button 
                        onClick={handleCreateBadge} 
                        className="w-full"
                        disabled={createBadgeMutation.isPending || isUploading}
                      >
                        {(createBadgeMutation.isPending || isUploading) ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {isUploading ? 'Uploading...' : 'Create Badge'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {badgesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : badges.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {badges.map((badge: any) => (
                    <Card key={badge.id} className={!badge.is_active ? 'opacity-50' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            {isEmojiIcon(badge.badge_icon) ? (
                              <div 
                                className="h-12 w-12 rounded-full flex items-center justify-center text-2xl"
                                style={{ backgroundColor: `${badge.badge_color}20` }}
                              >
                                {badge.badge_icon || '🏅'}
                              </div>
                            ) : (
                              <img 
                                src={badge.badge_icon} 
                                alt={badge.badge_name}
                                className="h-12 w-12 rounded-full object-cover border-2"
                                style={{ borderColor: badge.badge_color }}
                              />
                            )}
                            <div>
                              <p className="font-medium">{badge.badge_name}</p>
                              <p className="text-xs text-muted-foreground">{badge.badge_category}</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Dialog open={editingBadge?.id === badge.id} onOpenChange={(open) => !open && setEditingBadge(null)}>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditBadge(badge)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-lg">
                                <DialogHeader>
                                  <DialogTitle>Edit Badge</DialogTitle>
                                  <DialogDescription>
                                    Update badge details
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 pt-4 max-h-[60vh] overflow-y-auto">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label>Badge Key</Label>
                                      <Input 
                                        value={badgeForm.badge_key}
                                        onChange={(e) => setBadgeForm({...badgeForm, badge_key: e.target.value})}
                                        disabled
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Badge Name</Label>
                                      <Input 
                                        value={badgeForm.badge_name}
                                        onChange={(e) => setBadgeForm({...badgeForm, badge_name: e.target.value})}
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea 
                                      value={badgeForm.badge_description}
                                      onChange={(e) => setBadgeForm({...badgeForm, badge_description: e.target.value})}
                                    />
                                  </div>
                                  <div className="space-y-3">
                                    <Label>Icon Type</Label>
                                    <div className="flex gap-2">
                                      <Button
                                        type="button"
                                        variant={iconType === 'emoji' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => { setIconType('emoji'); clearIconFile(); }}
                                      >
                                        😀 Emoji
                                      </Button>
                                      <Button
                                        type="button"
                                        variant={iconType === 'image' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setIconType('image')}
                                      >
                                        <Image className="h-4 w-4 mr-1" /> Image
                                      </Button>
                                    </div>
                                    
                                    {iconType === 'emoji' ? (
                                      <div className="space-y-2">
                                        <Label>Emoji Icon</Label>
                                        <Input 
                                          value={badgeForm.badge_icon}
                                          onChange={(e) => setBadgeForm({...badgeForm, badge_icon: e.target.value})}
                                          className="text-2xl"
                                        />
                                      </div>
                                    ) : (
                                      <div className="space-y-2">
                                        <Label>Upload Image</Label>
                                        {(iconPreview || (!isEmojiIcon(badgeForm.badge_icon) && badgeForm.badge_icon)) ? (
                                          <div className="flex items-center gap-3">
                                            <img 
                                              src={iconPreview || badgeForm.badge_icon} 
                                              alt="Badge icon preview" 
                                              className="h-16 w-16 rounded-lg object-cover border"
                                            />
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              onClick={clearIconFile}
                                            >
                                              <X className="h-4 w-4 mr-1" /> Change
                                            </Button>
                                          </div>
                                        ) : (
                                          <div className="border-2 border-dashed rounded-lg p-4 text-center">
                                            <input
                                              type="file"
                                              accept="image/*"
                                              onChange={handleIconFileChange}
                                              className="hidden"
                                              id="badge-icon-upload-edit"
                                            />
                                            <label 
                                              htmlFor="badge-icon-upload-edit" 
                                              className="cursor-pointer flex flex-col items-center gap-2"
                                            >
                                              <Upload className="h-8 w-8 text-muted-foreground" />
                                              <span className="text-sm text-muted-foreground">
                                                Click to upload (max 2MB)
                                              </span>
                                            </label>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Badge Color</Label>
                                    <div className="flex gap-2">
                                      <Input 
                                        type="color" 
                                        value={badgeForm.badge_color}
                                        onChange={(e) => setBadgeForm({...badgeForm, badge_color: e.target.value})}
                                        className="w-12 h-10 p-1"
                                      />
                                      <Input 
                                        value={badgeForm.badge_color}
                                        onChange={(e) => setBadgeForm({...badgeForm, badge_color: e.target.value})}
                                        className="flex-1"
                                      />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label>Category</Label>
                                      <Select value={badgeForm.badge_category} onValueChange={(v) => setBadgeForm({...badgeForm, badge_category: v})}>
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="achievement">Achievement</SelectItem>
                                          <SelectItem value="score">Score</SelectItem>
                                          <SelectItem value="trait">Trait</SelectItem>
                                          <SelectItem value="special">Special</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>XP Reward</Label>
                                      <Input 
                                        type="number" 
                                        value={badgeForm.xp_reward}
                                        onChange={(e) => setBadgeForm({...badgeForm, xp_reward: parseInt(e.target.value) || 0})}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input 
                                        type="checkbox" 
                                        checked={badgeForm.is_active}
                                        onChange={(e) => setBadgeForm({...badgeForm, is_active: e.target.checked})}
                                        className="rounded"
                                      />
                                      <span className="text-sm">Active</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input 
                                        type="checkbox" 
                                        checked={badgeForm.is_featured}
                                        onChange={(e) => setBadgeForm({...badgeForm, is_featured: e.target.checked})}
                                        className="rounded"
                                      />
                                      <span className="text-sm">Featured</span>
                                    </label>
                                  </div>
                                  <Button 
                                    onClick={handleUpdateBadge} 
                                    className="w-full"
                                    disabled={updateBadgeMutation.isPending || isUploading}
                                  >
                                    {(updateBadgeMutation.isPending || isUploading) ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    {isUploading ? 'Uploading...' : 'Update Badge'}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteBadge(badge)}
                              disabled={deleteBadgeMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {badge.badge_description || 'No description'}
                        </p>
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <Badge variant={badge.is_active ? "default" : "outline"}>
                            {badge.is_active ? "Active" : "Inactive"}
                          </Badge>
                          {badge.is_featured && (
                            <Badge variant="secondary">Featured</Badge>
                          )}
                          <Badge variant="outline">+{badge.xp_reward} XP</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No badges created yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Click "Create Badge" to add your first badge</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ETHOS Tab */}
        <TabsContent value="ethos" className="mt-6">
          {!(isAdmin || canManageContent) ? (
            <Card><CardContent className="p-12 text-center text-muted-foreground">Access Denied — manage_content permission required.</CardContent></Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <CardTitle>ETHOS Management</CardTitle>
                    <CardDescription>Create and manage ETHOS organizations ({ethosListData.length} total)</CardDescription>
                  </div>
                  <Button onClick={openCreateEthos}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create ETHOS
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {ethosLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : ethosListData.length === 0 ? (
                  <div className="text-center py-12">
                    <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No ETHOS organizations yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Click "Create ETHOS" to add the first one</p>
                  </div>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 font-medium">Name</th>
                          <th className="text-left p-3 font-medium hidden md:table-cell">Slug</th>
                          <th className="text-left p-3 font-medium hidden lg:table-cell">Sector</th>
                          <th className="text-left p-3 font-medium hidden lg:table-cell">Type</th>
                          <th className="text-left p-3 font-medium hidden md:table-cell">Members</th>
                          <th className="text-left p-3 font-medium">Active</th>
                          <th className="text-right p-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ethosListData.map((ethos: any) => (
                          <tr key={ethos.id} className="border-t hover:bg-muted/30 transition-colors">
                            <td className="p-3 font-medium">{ethos.name}</td>
                            <td className="p-3 text-muted-foreground hidden md:table-cell">{ethos.slug}</td>
                            <td className="p-3 hidden lg:table-cell">
                              {ethos.sector ? <Badge variant="outline" className="capitalize">{ethos.sector}</Badge> : <span className="text-muted-foreground">—</span>}
                            </td>
                            <td className="p-3 hidden lg:table-cell capitalize text-muted-foreground">{ethos.ethos_type || "—"}</td>
                            <td className="p-3 hidden md:table-cell text-muted-foreground">{ethos.member_count ?? "—"}</td>
                            <td className="p-3">
                              <Switch
                                checked={ethos.is_active}
                                onCheckedChange={(checked) =>
                                  updateEthosMutation.mutate({ id: ethos.id, data: { is_active: checked } })
                                }
                              />
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button size="sm" variant="outline" title="Manage Access"
                                  onClick={() => { setAccessEthos(ethos); setAccessUserSearch(''); setAccessUserResults([]); setIsAccessDialogOpen(true); }}>
                                  <Shield className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => openEditEthos(ethos)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" className="text-destructive hover:text-destructive"
                                  onClick={() => setEthosDeleteTarget(ethos)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ETHOS Create/Edit Dialog */}
          <Dialog open={isEthosDialogOpen} onOpenChange={(open) => { setIsEthosDialogOpen(open); if (!open) { setEditingEthos(null); setEthosForm(defaultEthosForm); } }}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingEthos ? `Edit: ${editingEthos.name}` : "Create New ETHOS"}</DialogTitle>
                <DialogDescription>Fill in the organization details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input value={ethosForm.name} onChange={(e) => {
                      const name = e.target.value;
                      const slug = ethosForm.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                      setEthosForm({ ...ethosForm, name, slug: editingEthos ? ethosForm.slug : slug });
                    }} placeholder="Open Tech Commons" />
                  </div>
                  <div className="space-y-2">
                    <Label>Slug *</Label>
                    <Input value={ethosForm.slug} onChange={(e) => setEthosForm({ ...ethosForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} placeholder="open-tech-commons" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tagline</Label>
                  <Input value={ethosForm.tagline} onChange={(e) => setEthosForm({ ...ethosForm, tagline: e.target.value })} placeholder="Short tagline" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={ethosForm.description} onChange={(e) => setEthosForm({ ...ethosForm, description: e.target.value })} rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Mission</Label>
                  <Textarea value={ethosForm.mission} onChange={(e) => setEthosForm({ ...ethosForm, mission: e.target.value })} rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>External URL</Label>
                    <Input value={ethosForm.external_url} onChange={(e) => setEthosForm({ ...ethosForm, external_url: e.target.value })} placeholder="https://..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Image URL</Label>
                    <Input value={ethosForm.image_url} onChange={(e) => setEthosForm({ ...ethosForm, image_url: e.target.value })} placeholder="https://..." />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Parent ETHOS</Label>
                  <Select value={ethosForm.parent_ethos_id || "none"} onValueChange={(v) => setEthosForm({ ...ethosForm, parent_ethos_id: v === "none" ? "" : v })}>
                    <SelectTrigger><SelectValue placeholder="None (top-level)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (top-level)</SelectItem>
                      {ethosListData.filter((e: any) => e.id !== editingEthos?.id).map((e: any) => (
                        <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch checked={ethosForm.is_public} onCheckedChange={(v) => setEthosForm({ ...ethosForm, is_public: v })} id="ethos-public" />
                    <Label htmlFor="ethos-public">Is Public</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={ethosForm.is_active} onCheckedChange={(v) => setEthosForm({ ...ethosForm, is_active: v })} id="ethos-active" />
                    <Label htmlFor="ethos-active">Is Active</Label>
                  </div>
                </div>
                {/* C3: Phase, Map, External Links */}
                <div className="space-y-2">
                  <Label>Phase</Label>
                  <Select value={ethosForm.phase} onValueChange={(v) => setEthosForm({ ...ethosForm, phase: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="forming">Forming</SelectItem>
                      <SelectItem value="startup">Startup</SelectItem>
                      <SelectItem value="established">Established</SelectItem>
                      <SelectItem value="full throttle">Full Throttle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Map URL <span className="text-muted-foreground font-normal">(Miro embed URL or image URL)</span></Label>
                    <Input value={ethosForm.map_url} onChange={(e) => setEthosForm({ ...ethosForm, map_url: e.target.value })} placeholder="https://..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Map Type</Label>
                    <Select value={ethosForm.map_type} onValueChange={(v) => setEthosForm({ ...ethosForm, map_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="miro">Miro Embed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Map Title</Label>
                  <Input value={ethosForm.map_title} onChange={(e) => setEthosForm({ ...ethosForm, map_title: e.target.value })} placeholder="e.g. Team Structure Map" />
                </div>
                <div className="space-y-2">
                  <Label>External Links</Label>
                  {ethosForm.external_links.map((link, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Input
                        placeholder="Label"
                        value={link.label}
                        onChange={(e) => {
                          const updated = ethosForm.external_links.map((l, idx) => idx === i ? { ...l, label: e.target.value } : l);
                          setEthosForm({ ...ethosForm, external_links: updated });
                        }}
                        className="w-36 flex-shrink-0"
                      />
                      <Input
                        placeholder="https://..."
                        value={link.url}
                        onChange={(e) => {
                          const updated = ethosForm.external_links.map((l, idx) => idx === i ? { ...l, url: e.target.value } : l);
                          setEthosForm({ ...ethosForm, external_links: updated });
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive flex-shrink-0"
                        onClick={() => setEthosForm({ ...ethosForm, external_links: ethosForm.external_links.filter((_, idx) => idx !== i) })}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setEthosForm({ ...ethosForm, external_links: [...ethosForm.external_links, { label: "", url: "" }] })}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Link
                  </Button>
                </div>
                <div className="flex gap-2 justify-end pt-2 border-t">
                  <Button variant="outline" onClick={() => setIsEthosDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSaveEthos} disabled={createEthosMutation.isPending || updateEthosMutation.isPending}>
                    {(createEthosMutation.isPending || updateEthosMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingEthos ? "Save Changes" : "Create ETHOS"}
                  </Button>
                </div>

                {/* Members sub-panel (only shown when editing) */}
                {editingEthos && (
                  <div className="border-t pt-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      <h3 className="font-semibold">Members</h3>
                      <Badge variant="outline">{ethosMembers.length}</Badge>
                    </div>

                    {/* Member list */}
                    {ethosMembers.length > 0 && (
                      <div className="space-y-2">
                        {ethosMembers.map((m: any) => (
                          <div key={m.id} className="flex items-center justify-between p-2 rounded border bg-muted/30">
                            <div>
                              <span className="font-medium">{[m.profiles?.first_name, m.profiles?.last_name].filter(Boolean).join(' ') || m.profiles?.username || m.user_id}</span>
                              <span className="text-muted-foreground text-sm ml-2">{m.role_in_ethos}</span>
                              <Badge variant="outline" className="ml-2 text-xs">{m.member_type}</Badge>
                            </div>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"
                              onClick={() => removeEthosMemberMutation.mutate({ ethos_id: editingEthos.id, user_id: m.user_id })}
                              disabled={removeEthosMemberMutation.isPending}>
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add member */}
                    <div className="space-y-3 p-3 border rounded bg-muted/20">
                      <p className="text-sm font-medium">Add Member</p>
                      <div className="space-y-2">
                        <Input
                          placeholder="Search by username or email..."
                          value={ethosUserSearch}
                          onChange={(e) => { setEthosUserSearch(e.target.value); searchEthosUsers(e.target.value); }}
                        />
                        {ethosUserResults.length > 0 && (
                          <div className="border rounded bg-background shadow-sm max-h-40 overflow-y-auto">
                            {ethosUserResults.map((u: any) => (
                              <button key={u.id} type="button"
                                className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2"
                                onClick={() => {
                                  setMemberForm({ ...memberForm, user_id: u.id });
                                  setEthosUserSearch([u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || u.id);
                                  setEthosUserResults([]);
                                }}>
                                {u.avatar_url && (
                                  <img src={u.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                                )}
                                <div className="flex flex-col min-w-0">
                                  <span className="truncate">{[u.first_name, u.last_name].filter(Boolean).join(' ') || u.username}</span>
                                  {u.username && <span className="text-xs text-muted-foreground">@{u.username}</span>}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Role in ETHOS</Label>
                          <Input placeholder="e.g. steward" value={memberForm.role_in_ethos}
                            onChange={(e) => setMemberForm({ ...memberForm, role_in_ethos: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Member Type</Label>
                          <Select value={memberForm.member_type} onValueChange={(v) => setMemberForm({ ...memberForm, member_type: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {["member","steward","founder","pool"].map(t => (
                                <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button size="sm" disabled={!memberForm.user_id || addEthosMemberMutation.isPending}
                        onClick={() => addEthosMemberMutation.mutate({ ethos_id: editingEthos.id, ...memberForm })}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Member
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Manage Access Dialog */}
          <Dialog open={isAccessDialogOpen} onOpenChange={(open) => { setIsAccessDialogOpen(open); if (!open) { setAccessEthos(null); setAccessUserSearch(''); setAccessUserResults([]); } }}>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Manage Access — {accessEthos?.name}</DialogTitle>
                <DialogDescription>Grant or revoke Discover access for this ETHOS</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                {/* Current grants */}
                <div>
                  <p className="text-sm font-medium mb-2">Current Access ({(ethosAccessGrants as any[]).length})</p>
                  {(ethosAccessGrants as any[]).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No users have been granted access yet.</p>
                  ) : (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {(ethosAccessGrants as any[]).map((g: any) => {
                        const profile = users.find((u: any) => u.id === g.user_id);
                        const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || profile?.username || g.user_id;
                        return (
                          <div key={g.id} className="flex items-center justify-between p-2 rounded border bg-muted/30">
                            <div>
                              <span className="font-medium text-sm">{displayName}</span>
                              {profile?.username && <span className="text-muted-foreground text-xs ml-2">@{profile.username}</span>}
                            </div>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"
                              onClick={() => revokeAccessMutation.mutate({ ethos_id: accessEthos.id, user_id: g.user_id })}
                              disabled={revokeAccessMutation.isPending}>
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Grant access */}
                <div className="border-t pt-3 space-y-2">
                  <p className="text-sm font-medium">Grant Access</p>
                  <Input
                    placeholder="Search by username or email..."
                    value={accessUserSearch}
                    onChange={(e) => { setAccessUserSearch(e.target.value); searchAccessUsers(e.target.value); }}
                  />
                  {accessUserResults.length > 0 && (
                    <div className="border rounded bg-background shadow-sm max-h-40 overflow-y-auto">
                      {accessUserResults.map((u: any) => (
                        <button key={u.id} type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center justify-between"
                          onClick={() => grantAccessMutation.mutate({ ethos_id: accessEthos.id, user_id: u.id })}
                          disabled={grantAccessMutation.isPending}>
                          <span>{u.username || u.display_name} {u.email && <span className="text-muted-foreground">({u.email})</span>}</span>
                          <UserPlus className="h-3 w-3 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Soft-delete confirmation */}
          <AlertDialog open={!!ethosDeleteTarget} onOpenChange={(open) => !open && setEthosDeleteTarget(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Deactivate ETHOS?</AlertDialogTitle>
                <AlertDialogDescription>
                  "{ethosDeleteTarget?.name}" will be set to inactive. It won't appear publicly but data is preserved.
                  To permanently delete, deactivate first then confirm hard delete.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button variant="outline" onClick={() => {
                  setEthosHardDeleteTarget(ethosDeleteTarget);
                  setEthosDeleteTarget(null);
                }}>Hard Delete Instead</Button>
                <AlertDialogAction onClick={() => deleteEthosMutation.mutate({ id: ethosDeleteTarget.id, hard: false })}>
                  Deactivate
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Hard-delete confirmation */}
          <AlertDialog open={!!ethosHardDeleteTarget} onOpenChange={(open) => !open && setEthosHardDeleteTarget(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Permanently Delete ETHOS?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove "{ethosHardDeleteTarget?.name}" and all associated data. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => deleteEthosMutation.mutate({ id: ethosHardDeleteTarget.id, hard: true })}>
                  Delete Permanently
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        {/* OmniBot Session History Tab */}
        <TabsContent value="omnibot" className="mt-6">
          {!isAdmin ? (
            <Card><CardContent className="p-12 text-center text-muted-foreground">Admin access required.</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Session List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" /> OmniBot Sessions
                  </CardTitle>
                  <div className="space-y-2 pt-2">
                    <Input placeholder="Search by username..." value={omnibotSearch}
                      onChange={(e) => setOmnibotSearch(e.target.value)} />
                    <Select value={omnibotSessionTypeFilter} onValueChange={setOmnibotSessionTypeFilter}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="orientation">Orientation</SelectItem>
                        <SelectItem value="intake">Intake</SelectItem>
                        <SelectItem value="ongoing">Ongoing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {omnibotLoading ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                  ) : (
                    <div className="divide-y max-h-[60vh] overflow-y-auto">
                      {omnibotSessions
                        .filter((s: any) => omnibotSessionTypeFilter === "all" || s.session_type === omnibotSessionTypeFilter)
                        .filter((s: any) => !omnibotSearch || s.profiles?.username?.toLowerCase().includes(omnibotSearch.toLowerCase()))
                        .map((session: any) => {
                          const msgs: any[] = Array.isArray(session.messages) ? session.messages : [];
                          const lastMsg = msgs[msgs.length - 1];
                          return (
                            <button key={session.id} type="button"
                              className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${selectedOmnibotSession?.id === session.id ? 'bg-muted' : ''}`}
                              onClick={() => setSelectedOmnibotSession(session)}>
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">{session.profiles?.username || "Unknown User"}</span>
                                <Badge variant="outline" className="text-xs capitalize">{session.session_type}</Badge>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {new Date(session.created_at).toLocaleDateString()} · {msgs.length} messages
                              </div>
                              {lastMsg && (
                                <p className="text-xs text-muted-foreground mt-1 truncate">
                                  {lastMsg.content?.substring(0, 80)}
                                </p>
                              )}
                            </button>
                          );
                        })}
                      {omnibotSessions.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">No sessions found</div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Conversation Thread */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    {selectedOmnibotSession ? `Conversation — ${selectedOmnibotSession.profiles?.username || "Unknown"}` : "Select a session"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!selectedOmnibotSession ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p>Click a session on the left to view the conversation</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                      {(Array.isArray(selectedOmnibotSession.messages) ? selectedOmnibotSession.messages : []).map((msg: any, i: number) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                            msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                          }`}>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                            {msg.timestamp && (
                              <p className={`text-xs mt-1 opacity-60`}>
                                {new Date(msg.timestamp).toLocaleTimeString()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Settings Tab */}
        {(isAdmin || canManageContent) && (
          <TabsContent value="settings" className="mt-6">
            <div className="space-y-6 max-w-2xl">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <MapIcon className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle>Map Settings</CardTitle>
                      <CardDescription>
                        Configure the CTC Goals Map displayed on the Map page
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="ctc-prezi-url">CTC Map Prezi URL</Label>
                    <Input
                      id="ctc-prezi-url"
                      value={ctcMapForm.prezi_url}
                      onChange={(e) => setCtcMapForm((f) => ({ ...f, prezi_url: e.target.value }))}
                      placeholder="https://prezi.com/p/your-map-id/"
                    />
                    <p className="text-xs text-muted-foreground">
                      Paste the Prezi share link. It will be automatically converted to an embed URL.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ctc-description">Map Description</Label>
                    <Textarea
                      id="ctc-description"
                      value={ctcMapForm.description}
                      onChange={(e) =>
                        setCtcMapForm((f) => ({ ...f, description: e.target.value }))
                      }
                      placeholder="Brief description shown above the map..."
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={saveCtcMapSettings} disabled={savingCtcMap}>
                      {savingCtcMap ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Save Map Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
