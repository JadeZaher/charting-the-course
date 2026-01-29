import { useState } from "react";
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
  UserPlus, UsersRound, ClipboardList, Mail, Send, CheckCircle
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, Redirect, useLocation } from "wouter";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/lib/supabase";
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
import { useToast } from "@/hooks/use-toast";

type Role = "Admin" | "Facilitator" | "Contributor" | "Viewer";

const getRoleBadgeRole = (role?: string): Role => {
  if (!role) return "Viewer";
  return (role.charAt(0).toUpperCase() + role.slice(1)) as Role;
};

// Fetch users from profiles table with roles
async function fetchUsers() {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select(`
      id,
      first_name,
      last_name,
      username,
      avatar_url,
      profile_visibility,
      created_at
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Get roles for each user
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select(`
      user_id,
      roles (
        key,
        name
      )
    `);

  // Merge profiles with roles
  return profiles?.map(profile => {
    const roleData = userRoles?.find(ur => ur.user_id === profile.id);
    const roles = (roleData?.roles as unknown) as { key: string; name: string } | null;
    return {
      ...profile,
      role: roles?.key || 'viewer',
      roleName: roles?.name || 'Viewer',
    };
  }) || [];
}

// Fetch quizzes
async function fetchQuizzes() {
  const { data, error } = await supabase
    .from('quizzes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Fetch badge definitions
async function fetchBadges() {
  const { data, error } = await supabase
    .from('badge_definitions')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

// Fetch teams
async function fetchTeams() {
  // First, fetch teams with team_members
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select(`
      *,
      team_members (
        user_id
      )
    `)
    .order('created_at', { ascending: false });

  if (teamsError) {
    console.error('Error fetching teams:', teamsError);
    throw teamsError;
  }

  if (!teams || teams.length === 0) {
    return [];
  }

  // Get all unique user IDs from team members
  const userIds = new Set<string>();
  teams.forEach((team: any) => {
    if (team.team_members) {
      team.team_members.forEach((member: any) => {
        if (member.user_id) {
          userIds.add(member.user_id);
        }
      });
    }
  });

  // Fetch profiles for all team members
  let profilesMap: Record<string, any> = {};
  if (userIds.size > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, username')
      .in('id', Array.from(userIds));

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      // Continue without profiles if there's an error
    } else if (profiles) {
      profiles.forEach((profile: any) => {
        profilesMap[profile.id] = profile;
      });
    }
  }

  // Merge profiles into team_members
  const teamsWithProfiles = teams.map((team: any) => ({
    ...team,
    team_members: team.team_members?.map((member: any) => ({
      ...member,
      profile: profilesMap[member.user_id] || null,
    })) || [],
  }));

  console.log('Fetched teams:', teamsWithProfiles.length, 'teams');
  return teamsWithProfiles;
}

// Fetch quiz assignments
async function fetchAssignments() {
  // First, fetch assignments with quiz and team info (these have proper foreign keys)
  const { data: assignments, error: assignmentsError } = await supabase
    .from('quiz_assignments')
    .select(`
      *,
      quiz:quizzes (id, title),
      team:teams (id, name)
    `)
    .order('created_at', { ascending: false });

  if (assignmentsError) {
    console.error('Error fetching assignments:', assignmentsError);
    throw assignmentsError;
  }

  if (!assignments || assignments.length === 0) {
    return [];
  }

  // Get all unique user IDs from assignments
  const userIds = new Set<string>();
  assignments.forEach((assignment: any) => {
    if (assignment.user_id) {
      userIds.add(assignment.user_id);
    }
  });

  // Fetch profiles for all assigned users
  let profilesMap: Record<string, any> = {};
  if (userIds.size > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, username')
      .in('id', Array.from(userIds));

    if (profilesError) {
      console.error('Error fetching profiles for assignments:', profilesError);
      // Continue without profiles if there's an error
    } else if (profiles) {
      profiles.forEach((profile: any) => {
        profilesMap[profile.id] = profile;
      });
    }
  }

  // Merge profiles into assignments
  const assignmentsWithProfiles = assignments.map((assignment: any) => ({
    ...assignment,
    user: assignment.user_id ? profilesMap[assignment.user_id] || null : null,
  }));

  console.log('Fetched assignments:', assignmentsWithProfiles.length, 'assignments');
  return assignmentsWithProfiles;
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

// Ensure badges bucket exists (check and create if needed)
async function ensureBadgesBucket(): Promise<boolean> {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.warn('Could not list buckets:', listError.message);
      return false;
    }

    const badgesBucket = buckets?.find(b => b.id === 'badges');
    
    if (badgesBucket) {
      return true; // Bucket exists
    }

    // Bucket doesn't exist - try to create it using the database function
    console.log('Badges bucket not found, attempting to create...');
    const { data: result, error: rpcError } = await supabase.rpc('ensure_badges_bucket');

    if (rpcError) {
      console.warn('Could not create bucket automatically:', rpcError.message);
      console.warn('Please run: npm run ensure-bucket or create it in Supabase Dashboard');
      return false;
    }

    if (result?.success) {
      console.log('✅ Badges bucket created successfully');
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error ensuring badges bucket:', error);
    return false;
  }
}

// Upload badge icon to Supabase Storage
async function uploadBadgeIcon(file: File, badgeKey: string): Promise<string> {
  try {
    // Ensure bucket exists first
    const bucketExists = await ensureBadgesBucket();
    if (!bucketExists) {
      throw new Error('Badges storage bucket does not exist. Please run: npm run ensure-bucket (or create it in Supabase Dashboard)');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error(`File size exceeds 5MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${badgeKey}-${Date.now()}.${fileExt}`;
    const filePath = `badge-icons/${fileName}`;

    // Upload file
    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('badges')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      
      // Check if it's a bucket not found error
      if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('not found')) {
        throw new Error('Badges storage bucket does not exist. Please create it in Supabase Dashboard > Storage, or run the migration: supabase db push');
      }
      
      throw new Error(`Upload failed: ${uploadError.message}. Please ensure the badges storage bucket exists and you have upload permissions.`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('badges')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL for uploaded file');
    }

    return urlData.publicUrl;
  } catch (error: any) {
    console.error('Badge icon upload error:', error);
    throw error instanceof Error ? error : new Error(`Upload failed: ${String(error)}`);
  }
}

export default function AdminPanel() {
  // All hooks must be called at the top, before any conditional returns
  const { isAdmin, canManageUsers, isLoading: roleLoading } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  // State hooks
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newRole, setNewRole] = useState("");
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

  // Badge mutations
  const createBadgeMutation = useMutation({
    mutationFn: async (data: BadgeFormData) => {
      const { error } = await supabase
        .from('badge_definitions')
        .insert({
          ...data,
          conditions: { type: 'custom' },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      if (error) throw error;
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
    mutationFn: async ({ id, data }: { id: string; data: Partial<BadgeFormData> }) => {
      const { error } = await supabase
        .from('badge_definitions')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
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
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('badge_definitions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-badges'] });
      toast({ title: "Badge Deleted", description: "Badge has been deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Team mutations
  const createTeamMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; member_ids: string[] }) => {
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({ name: data.name, description: data.description })
        .select()
        .single();
      
      if (teamError) throw teamError;
      
      if (data.member_ids.length > 0) {
        const members = data.member_ids.map(userId => ({
          team_id: team.id,
          user_id: userId,
        }));
        const { error: membersError } = await supabase
          .from('team_members')
          .insert(members);
        if (membersError) throw membersError;
      }
      
      return team;
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
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('teams').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teams'] });
      toast({ title: "Team Deleted", description: "Team has been deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

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
      
      const { error } = await supabase.from('quiz_assignments').insert(assignments);
      if (error) throw error;
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
      const { error } = await supabase.from('quiz_assignments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-assignments'] });
      toast({ title: "Assignment Removed", description: "Quiz assignment has been removed" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; first_name: string; last_name: string; role: string }) => {
      // Create user via Supabase Admin API
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: {
          first_name: data.first_name,
          last_name: data.last_name,
        },
      });
      
      if (authError) throw authError;
      
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          username: data.email.split('@')[0],
        })
        .eq('id', authData.user.id);
      
      if (profileError) console.error('Profile update error:', profileError);
      
      // Assign role
      const { data: roleData } = await supabase
        .from('roles')
        .select('id')
        .eq('key', data.role)
        .single();
      
      if (roleData) {
        await supabase
          .from('user_roles')
          .upsert({
            user_id: authData.user.id,
            role_id: roleData.id,
          });
      }
      
      return authData.user;
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
      // Get role ID
      const { data: roleData } = await supabase
        .from('roles')
        .select('id')
        .eq('key', newRole)
        .single();

      if (!roleData) throw new Error('Role not found');

      // Update user role
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: selectedUser.id,
          role_id: roleData.id,
          assigned_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;

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
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setNewRole(user.role);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit Role
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Change User Role</DialogTitle>
                            <DialogDescription>
                              Update the role for {user.first_name || user.username}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <Label>New Role</Label>
                              <Select value={newRole} onValueChange={setNewRole}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="facilitator">Facilitator</SelectItem>
                                  <SelectItem value="contributor">Contributor</SelectItem>
                                  <SelectItem value="viewer">Viewer</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Button onClick={handleRoleChange} className="w-full">
                              Update Role
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
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
      </Tabs>
    </div>
  );
}
