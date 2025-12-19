import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoleBadge } from "@/components/RoleBadge";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, Users, Loader2, Edit, Eye, History, 
  Mail, Calendar, Shield, UserCheck, UserX
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link, Redirect } from "wouter";
import { useRoleAccess } from "@/hooks/useRoleAccess";
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
  email?: string;
  quiz_count?: number;
}

// Fetch users from profiles table with roles and quiz counts
async function fetchUsers(): Promise<UserProfile[]> {
  // Fetch profiles
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

  // Fetch user roles
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

  // Fetch quiz result counts per user
  const { data: quizCounts, error: quizError } = await supabase
    .from('quiz_results')
    .select('user_id');

  if (quizError) console.error('Error fetching quiz counts:', quizError);

  // Count quizzes per user
  const quizCountMap: Record<string, number> = {};
  quizCounts?.forEach(result => {
    quizCountMap[result.user_id] = (quizCountMap[result.user_id] || 0) + 1;
  });

  // Merge all data
  return profiles?.map(profile => ({
    ...profile,
    role: userRoles?.find(ur => ur.user_id === profile.id)?.roles?.key || 'viewer',
    roleName: userRoles?.find(ur => ur.user_id === profile.id)?.roles?.name || 'Viewer',
    quiz_count: quizCountMap[profile.id] || 0,
  })) || [];
}

export default function UserManagement() {
  const { permissions, isLoading: roleLoading } = useRoleAccess();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [newRole, setNewRole] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // All hooks must be called before any conditional returns
  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-users-management'],
    queryFn: fetchUsers,
    retry: false,
    enabled: permissions.isAdmin, // Only fetch if admin
  });

  // Check access - these returns come AFTER all hooks
  if (roleLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!permissions.isAdmin) {
    return <Redirect to="/" />;
  }

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.first_name && user.first_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.last_name && user.last_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Stats
  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    facilitators: users.filter(u => u.role === 'facilitator').length,
    viewers: users.filter(u => u.role === 'viewer').length,
  };

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) return;

    try {
      // Get role ID
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('key', newRole)
        .single();

      if (roleError || !roleData) throw new Error('Role not found');

      // Delete existing role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedUser.id);

      // Insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedUser.id,
          role_id: roleData.id,
          assigned_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Role Updated",
        description: `${selectedUser.first_name || selectedUser.username}'s role has been changed to ${newRole}`,
      });

      refetch();
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8" />
          User Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage user accounts, roles, and view their activity
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
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
                <p className="text-2xl font-bold">{stats.admins}</p>
                <p className="text-xs text-muted-foreground">Admins</p>
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
                <p className="text-2xl font-bold">{stats.facilitators}</p>
                <p className="text-xs text-muted-foreground">Facilitators</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <UserX className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.viewers}</p>
                <p className="text-xs text-muted-foreground">Viewers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>All Users</CardTitle>
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
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="facilitator">Facilitator</SelectItem>
                  <SelectItem value="contributor">Contributor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
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
                    <TableHead>Role</TableHead>
                    <TableHead className="hidden md:table-cell">Quizzes Taken</TableHead>
                    <TableHead className="hidden md:table-cell">Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
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
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="secondary">
                          {user.quiz_count} quiz{user.quiz_count !== 1 ? 'zes' : ''}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/admin/users/${user.id}/history`}>
                            <Button variant="ghost" size="icon" title="View Quiz History">
                              <History className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                title="Edit Role"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setNewRole(user.role);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Change User Role</DialogTitle>
                                <DialogDescription>
                                  Update the role for {getDisplayName(user)}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 pt-4">
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                                  <Avatar>
                                    <AvatarImage src={user.avatar_url || ''} />
                                    <AvatarFallback>{getInitials(user)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{getDisplayName(user)}</p>
                                    <p className="text-sm text-muted-foreground">
                                      Current: {user.roleName}
                                    </p>
                                  </div>
                                </div>
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
                {searchQuery || roleFilter !== "all" 
                  ? "No users match your filters" 
                  : "No users found"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

