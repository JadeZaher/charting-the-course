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
  Search, Users, Loader2, Edit, History, 
  Shield, UserCheck, Archive, ArchiveRestore
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, Redirect } from "wouter";
import { usePermissions, Permission, ALL_PERMISSIONS, PERMISSION_LABELS, PERMISSION_DESCRIPTIONS } from "@/hooks/usePermissions";
import { supabase } from "@/lib/supabase";
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
  const { data: profiles, error: profileError } = await supabase
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

  if (profileError) throw profileError;

  const { data: usersData, error: usersError } = await supabase
    .from('users')
    .select('id, permissions, is_archived, role');

  if (usersError) console.error('Error fetching users data:', usersError);

  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select(`
      user_id,
      roles (
        key,
        name
      )
    `);

  if (rolesError) console.error('Error fetching roles:', rolesError);

  const { data: quizCounts, error: quizError } = await supabase
    .from('quiz_results')
    .select('user_id');

  if (quizError) console.error('Error fetching quiz counts:', quizError);

  const quizCountMap: Record<string, number> = {};
  quizCounts?.forEach(result => {
    quizCountMap[result.user_id] = (quizCountMap[result.user_id] || 0) + 1;
  });

  const usersMap: Record<string, { permissions: Permission[], isArchived: boolean, role?: string }> = {};
  usersData?.forEach(u => {
    usersMap[u.id] = {
      permissions: (u.permissions as Permission[]) || [],
      isArchived: u.is_archived || false,
      role: u.role
    };
  });

  return profiles?.map(profile => {
    const userData = usersMap[profile.id] || { permissions: [], isArchived: false };
    const roleData = userRoles?.find(ur => ur.user_id === profile.id);
    const roles = (roleData?.roles as unknown) as { key: string; name: string } | null;
    
    return {
      ...profile,
      role: userData.role || roles?.key || 'viewer',
      roleName: roles?.name || 'Viewer',
      permissions: userData.permissions,
      isArchived: userData.isArchived,
      quiz_count: quizCountMap[profile.id] || 0,
    };
  }) || [];
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

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-users-management'],
    queryFn: fetchUsers,
    retry: false,
    enabled: isAdmin || canManageUsers,
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ userId, permissions }: { userId: string; permissions: Permission[] }) => {
      const { error } = await supabase
        .from('users')
        .update({ permissions })
        .eq('id', userId);

      if (error) throw error;
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
      const { error } = await supabase
        .from('users')
        .update({ is_archived: archive })
        .eq('id', userId);

      if (error) throw error;
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
              <div className="p-2 rounded-lg bg-primary/10">
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
              <div className="p-2 rounded-lg bg-destructive/10">
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
              <div className="p-2 rounded-lg bg-blue-500/10">
                <UserCheck className="h-5 w-5 text-blue-500" />
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
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Archive className="h-5 w-5 text-amber-500" />
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
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="rounded-md border overflow-x-auto">
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow>
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
                          <Link href={`/admin/users/${user.id}/history`}>
                            <Button variant="ghost" size="icon" title="View Quiz History" data-testid={`button-history-${user.id}`}>
                              <History className="h-4 w-4" />
                            </Button>
                          </Link>
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
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
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
                    className="flex items-start gap-3 p-3 rounded-lg border hover-elevate cursor-pointer"
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
