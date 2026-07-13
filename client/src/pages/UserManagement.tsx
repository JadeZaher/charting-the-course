import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoleBadge } from "@/components/RoleBadge";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Search, Users, Loader2, Edit, History,
  Shield, UserCheck, Archive, ArchiveRestore,
  Download, Mail, CheckSquare, XSquare, Plus, X
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, Redirect } from "wouter";
import { usePermissions, Permission, ALL_PERMISSIONS, PERMISSION_LABELS, PERMISSION_DESCRIPTIONS } from "@/hooks/usePermissions";
import { fetchMembers, updateMember } from "@/lib/api-client";

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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type Role = "Admin" | "Facilitator" | "Contributor" | "Viewer";

const getRoleBadgeRole = (role?: string): Role => {
  if (!role) return "Viewer";
  return (role.charAt(0).toUpperCase() + role.slice(1)) as Role;
};

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  avatar_url: string | null;
  profile_visibility: string;
  created_at: string;
  role: string;
  roleName: string;
  permissions: Permission[];
  isArchived: boolean;
  email?: string;
  quiz_count?: number;
}

async function fetchUsers(): Promise<UserProfile[]> {
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
    quiz_count: m.quiz_count ?? 0,
  })) as UserProfile[];
}

export default function UserManagement() {
  const { canManageUsers, isAdmin, isLoading: permLoading } = usePermissions();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [editedPermissions, setEditedPermissions] = useState<Permission[]>([]);
  const [permissionFilter, setPermissionFilter] = useState<string>("all");
  const [showArchived, setShowArchived] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addSolutionOpen, setAddSolutionOpen] = useState<string | null>(null);

  // Batch selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkArchiveConfirm, setBulkArchiveConfirm] = useState(false);
  const [bulkRestoreConfirm, setBulkRestoreConfirm] = useState(false);
  const [bulkActionPending, setBulkActionPending] = useState(false);

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-users-management'],
    queryFn: fetchUsers,
    retry: false,
    enabled: isAdmin || canManageUsers,
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ userId, permissions }: { userId: string; permissions: Permission[] }) => {
      await updateMember(userId, { permissions });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-management'] });
      toast({
        title: "Permissions Updated",
        description: `${selectedUser?.first_name || selectedUser?.username}'s permissions have been updated`,
      });
      setDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update permissions",
        variant: "destructive",
      });
    },
  });

  const archiveUserMutation = useMutation({
    mutationFn: async ({ userId, archive }: { userId: string; archive: boolean }) => {
      await updateMember(userId, { is_archived: archive });
    },
    onSuccess: (_, { archive }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-management'] });
      toast({
        title: archive ? "User Archived" : "User Restored",
        description: archive 
          ? "User has been archived and hidden from active lists"
          : "User has been restored to active status",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
    },
  });

  if (permLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin && !canManageUsers) {
    return <Redirect to="/" />;
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.first_name && user.first_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.last_name && user.last_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesPermission = permissionFilter === "all" || 
      (permissionFilter === "none" && user.permissions.length === 0) ||
      user.permissions.includes(permissionFilter as Permission);
    const matchesArchiveFilter = showArchived ? user.isArchived : !user.isArchived;
    
    return matchesSearch && matchesPermission && matchesArchiveFilter;
  });

  const activeUsers = users.filter(u => !u.isArchived);
  const stats = {
    total: activeUsers.length,
    withManageUsers: activeUsers.filter(u => u.permissions.includes('manage_users')).length,
    withManageContent: activeUsers.filter(u => u.permissions.includes('manage_content')).length,
    archived: users.filter(u => u.isArchived).length,
  };

  const getDisplayName = (user: UserProfile) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user.username || 'Unknown User';
  };

  const getInitials = (user: UserProfile) => {
    const name = getDisplayName(user);
    return name.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  const handleEditPermissions = (user: UserProfile) => {
    setSelectedUser(user);
    setEditedPermissions([...user.permissions]);
    setDialogOpen(true);
  };

  const handlePermissionToggle = (permission: Permission) => {
    setEditedPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSavePermissions = () => {
    if (!selectedUser) return;
    updatePermissionsMutation.mutate({ 
      userId: selectedUser.id, 
      permissions: editedPermissions 
    });
  };

  const handleArchiveUser = (user: UserProfile) => {
    archiveUserMutation.mutate({ userId: user.id, archive: !user.isArchived });
  };

  // ——— Batch selection helpers ———
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredUsers.length && filteredUsers.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredUsers.map((u) => u.id)));
    }
  };

  const toggleSelectUser = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected =
    filteredUsers.length > 0 && selectedIds.size === filteredUsers.length;
  const someSelected = selectedIds.size > 0;

  const handleBulkArchive = async (archive: boolean) => {
    setBulkActionPending(true);
    const ids = Array.from(selectedIds);
    for (const userId of ids) {
      await updateMember(userId, { is_archived: archive }).catch(console.error);
    }
    setBulkActionPending(false);
    setSelectedIds(new Set());
    setBulkArchiveConfirm(false);
    setBulkRestoreConfirm(false);
    queryClient.invalidateQueries({ queryKey: ["admin-users-management"] });
    toast({
      title: archive
        ? `${ids.length} user${ids.length !== 1 ? "s" : ""} archived`
        : `${ids.length} user${ids.length !== 1 ? "s" : ""} restored`,
    });
  };

  // ——— CSV export ———
  const handleExportCSV = () => {
    const rows = filteredUsers.map((u) => ({
      username: u.username || "",
      name: getDisplayName(u),
      role: u.roleName,
      permissions: u.permissions.join("|"),
      archived: u.isArchived ? "yes" : "no",
      quiz_count: u.quiz_count ?? 0,
      joined: new Date(u.created_at).toLocaleDateString(),
    }));

    const headers = ["username", "name", "role", "permissions", "archived", "quiz_count", "joined"];
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        headers
          .map((h) => {
            const v = String((r as any)[h]);
            return v.includes(",") ? `"${v}"` : v;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: `Exported ${rows.length} users as CSV` });
  };

  // ——— Resend invite ———
  const handleResendInvite = async (user: UserProfile) => {
    try {
      // TODO: Replace with Sanic API endpoint when invite management is implemented
      await apiFetch('/api/v1/members/resend-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });
      toast({
        title: "Invite resent",
        description: `An invitation email has been sent to ${user.username || getDisplayName(user)}.`,
      });
    } catch (err: any) {
      toast({
        title: "Resend failed",
        description: err.message || "Could not resend invite.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8" />
          User Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage user accounts, permissions, and archive status
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="border border-primary bg-primary/10 p-2">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="border border-destructive bg-destructive/10 p-2">
                <Shield className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.withManageUsers}</p>
                <p className="text-xs text-muted-foreground">User Managers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="border border-info bg-info/10 p-2">
                <UserCheck className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.withManageContent}</p>
                <p className="text-xs text-muted-foreground">Content Managers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="border border-warning bg-warning/10 p-2">
                <Archive className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.archived}</p>
                <p className="text-xs text-muted-foreground">Archived</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>{showArchived ? 'Archived Users' : 'Active Users'}</CardTitle>
              <CardDescription>
                {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-users"
                />
              </div>
              <Select value={permissionFilter} onValueChange={setPermissionFilter}>
                <SelectTrigger className="w-full sm:w-48" data-testid="select-permission-filter">
                  <SelectValue placeholder="Filter by permission" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="none">No Permissions</SelectItem>
                  {ALL_PERMISSIONS.map(perm => (
                    <SelectItem key={perm} value={perm}>{PERMISSION_LABELS[perm]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Switch
                  checked={showArchived}
                  onCheckedChange={setShowArchived}
                  data-testid="switch-show-archived"
                />
                <Label className="text-sm whitespace-nowrap">Show Archived</Label>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Bulk action toolbar */}
          {someSelected && (
            <div className="mb-3 flex items-center gap-3 border border-strong-border bg-muted px-4 py-3 text-sm">
              <span className="font-medium">
                {selectedIds.size} selected
              </span>
              <div className="flex items-center gap-2 ml-auto">
                {showArchived ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setBulkRestoreConfirm(true)}
                    disabled={bulkActionPending}
                  >
                    <ArchiveRestore className="h-3.5 w-3.5 mr-1.5" />
                    Restore Selected
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setBulkArchiveConfirm(true)}
                    disabled={bulkActionPending}
                  >
                    <Archive className="h-3.5 w-3.5 mr-1.5" />
                    Archive Selected
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedIds(new Set())}
                >
                  <XSquare className="h-3.5 w-3.5 mr-1.5" />
                  Clear
                </Button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="overflow-x-auto rounded-none border-2 border-strong-border">
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Legacy Role</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead className="hidden md:table-cell">Quizzes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className={user.isArchived ? 'opacity-60' : ''}>
                      <TableCell className="w-10">
                        <Checkbox
                          checked={selectedIds.has(user.id)}
                          onCheckedChange={() => toggleSelectUser(user.id)}
                          aria-label={`Select ${getDisplayName(user)}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={user.avatar_url || ''} />
                            <AvatarFallback className="text-xs">
                              {getInitials(user)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{getDisplayName(user)}</p>
                            <p className="text-xs text-muted-foreground">
                              @{user.username || 'no-username'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <RoleBadge role={getRoleBadgeRole(user.role)} />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.permissions.length > 0 ? (
                            user.permissions.map(perm => (
                              <Badge key={perm} variant="outline" className="text-xs">
                                {PERMISSION_LABELS[perm]}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">No permissions</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="secondary">
                          {user.quiz_count}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button asChild variant="ghost" size="icon" title="View Quiz History" data-testid={`button-history-${user.id}`}>
                            <Link href={`/admin/users/${user.id}/history`}>
                              <History className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            title="Edit Permissions"
                            onClick={() => handleEditPermissions(user)}
                            data-testid={`button-edit-${user.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Resend Invite Email"
                            onClick={() => handleResendInvite(user)}
                            data-testid={`button-invite-${user.id}`}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title={user.isArchived ? "Restore User" : "Archive User"}
                            onClick={() => handleArchiveUser(user)}
                            data-testid={`button-archive-${user.id}`}
                          >
                            {user.isArchived ? (
                              <ArchiveRestore className="h-4 w-4" />
                            ) : (
                              <Archive className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || permissionFilter !== "all" 
                  ? "No users match your filters" 
                  : showArchived 
                    ? "No archived users"
                    : "No active users found"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Archive Confirmation */}
      <AlertDialog open={bulkArchiveConfirm} onOpenChange={setBulkArchiveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {selectedIds.size} users?</AlertDialogTitle>
            <AlertDialogDescription>
              These users will be archived and hidden from active lists. You can restore them later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleBulkArchive(true)}
              className="bg-destructive hover:bg-destructive/90"
              disabled={bulkActionPending}
            >
              {bulkActionPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Archive All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Restore Confirmation */}
      <AlertDialog open={bulkRestoreConfirm} onOpenChange={setBulkRestoreConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore {selectedIds.size} users?</AlertDialogTitle>
            <AlertDialogDescription>
              These users will be restored to active status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleBulkArchive(false)}
              disabled={bulkActionPending}
            >
              {bulkActionPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Restore All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User Permissions</DialogTitle>
            <DialogDescription>
              Update permissions for {selectedUser ? getDisplayName(selectedUser) : 'user'}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3 border border-strong-border bg-muted p-4">
                <Avatar>
                  <AvatarImage src={selectedUser.avatar_url || ''} />
                  <AvatarFallback>{getInitials(selectedUser)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{getDisplayName(selectedUser)}</p>
                  <p className="text-sm text-muted-foreground">
                    Legacy Role: {selectedUser.roleName}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <Label className="text-sm font-medium">Permissions</Label>
                {ALL_PERMISSIONS.map(permission => (
                  <div 
                    key={permission}
                    className="flex cursor-pointer items-start gap-3 border border-strong-border p-4 transition-colors hover:bg-muted/50 motion-reduce:transition-none"
                    onClick={() => handlePermissionToggle(permission)}
                  >
                    <Checkbox
                      checked={editedPermissions.includes(permission)}
                      onCheckedChange={() => handlePermissionToggle(permission)}
                      data-testid={`checkbox-${permission}`}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{PERMISSION_LABELS[permission]}</p>
                      <p className="text-xs text-muted-foreground">
                        {PERMISSION_DESCRIPTIONS[permission]}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSavePermissions}
              disabled={updatePermissionsMutation.isPending}
              data-testid="button-save-permissions"
            >
              {updatePermissionsMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Permissions'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
