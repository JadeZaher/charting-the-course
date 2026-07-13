import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/RoleBadge";
import { 
  ArrowLeft, Loader2, History, Trophy, Clock, 
  Calendar, CheckCircle2, XCircle, BarChart3, Award, Eye, CheckCircle,
  Trash2, AlertTriangle, RefreshCw, RotateCcw
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, Redirect, useParams } from "wouter";
import { usePermissions } from "@/hooks/usePermissions";
import { fetchMember, fetchMemberQuizHistory, fetchMemberBadges } from "@/lib/api-client";

const BASE_URL = import.meta.env.VITE_API_URL || '';
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { credentials: 'include', ...options });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as any).error || res.statusText);
  }
  return res.json();
}
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

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
  bio: string | null;
  headline: string | null;
  profile_visibility: string;
  created_at: string;
  role?: string;
  roleName?: string;
}

interface QuizResult {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  is_passed: boolean | null;
  time_spent: number | null;
  completed_at: string;
  survey_results: any;
  quiz?: {
    title: string;
    description: string | null;
    survey_json: any;
  };
}

interface UserBadge {
  id: string;
  badge_key: string;
  badge_name: string;
  badge_icon: string | null;
  badge_color: string | null;
  earned_at: string;
  xp_reward?: number;
}

interface UserXP {
  total_xp: number;
  current_level: number;
  quiz_streak: number;
}

// Fetch user profile via Sanic BFF API
async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const data = await fetchMember(userId);
    return {
      id: (data as any).id,
      first_name: (data as any).display_name?.split(' ')[0] ?? null,
      last_name: (data as any).display_name?.split(' ').slice(1).join(' ') ?? null,
      username: (data as any).username ?? null,
      avatar_url: (data as any).avatar_url ?? null,
      bio: (data as any).bio ?? null,
      headline: (data as any).headline ?? null,
      profile_visibility: (data as any).profile_visibility ?? 'public',
      created_at: (data as any).created_at,
      role: (data as any).role ?? 'viewer',
      roleName: (data as any).role_name ?? 'Viewer',
    };
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}

// Fetch user's quiz results via Sanic BFF API
async function fetchUserQuizResults(userId: string): Promise<QuizResult[]> {
  try {
    const result = await fetchMemberQuizHistory(userId);
    const items = (result as any).results || (result as any).items || [];
    return items.map((r: any) => ({
      id: r.id,
      quiz_id: r.quiz_id,
      user_id: r.member_id || userId,
      score: r.score ?? 0,
      is_passed: r.is_passed ?? null,
      time_spent: r.time_spent ?? null,
      completed_at: r.completed_at,
      survey_results: r.survey_results ?? r.answers ?? {},
      quiz: r.quiz ?? null,
    })) as QuizResult[];
  } catch (error) {
    console.error('Error fetching quiz results:', error);
    return [];
  }
}

// Fetch user's badges via Sanic BFF API
async function fetchUserBadges(userId: string): Promise<UserBadge[]> {
  try {
    const result = await fetchMemberBadges(userId);
    const badges = (result as any).badges || [];
    return badges.map((b: any) => ({
      id: b.id,
      badge_key: b.badge_key || b.key,
      badge_name: b.badge_name || b.name,
      badge_icon: b.badge_icon || b.icon || null,
      badge_color: b.badge_color || b.color || null,
      earned_at: b.earned_at || b.created_at,
      xp_reward: b.xp_reward ?? 0,
    })) as UserBadge[];
  } catch (error) {
    console.error('Error fetching badges:', error);
    return [];
  }
}

// Fetch user XP — TODO: add XP endpoint to Sanic API
async function fetchUserXP(_userId: string): Promise<UserXP | null> {
  // TODO: Replace with Sanic API endpoint when XP/levels endpoint is implemented
  return null;
}

export default function UserQuizHistory() {
  const { isAdmin, canManageUsers, isLoading: roleLoading } = usePermissions();
  const params = useParams<{ userId: string }>();
  const userId = params.userId;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedResult, setSelectedResult] = useState<QuizResult | null>(null);
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const [selectedBadges, setSelectedBadges] = useState<Set<string>>(new Set());
  const [deleteResultDialog, setDeleteResultDialog] = useState<QuizResult | null>(null);
  const [deleteBadgeDialog, setDeleteBadgeDialog] = useState<UserBadge | null>(null);
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const [resetXPDialog, setResetXPDialog] = useState(false);

  // All hooks must be called before any conditional returns
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => fetchUserProfile(userId!),
    enabled: !!userId && !roleLoading && (isAdmin || canManageUsers),
  });

  const { data: quizResults = [], isLoading: resultsLoading } = useQuery({
    queryKey: ['user-quiz-results', userId],
    queryFn: () => fetchUserQuizResults(userId!),
    enabled: !!userId && !roleLoading && (isAdmin || canManageUsers),
  });

  const { data: badges = [], isLoading: badgesLoading } = useQuery({
    queryKey: ['user-badges-history', userId],
    queryFn: () => fetchUserBadges(userId!),
    enabled: !!userId && !roleLoading && (isAdmin || canManageUsers),
  });

  const { data: userXP } = useQuery({
    queryKey: ['user-xp', userId],
    queryFn: () => fetchUserXP(userId!),
    enabled: !!userId && !roleLoading && (isAdmin || canManageUsers),
  });

  // Delete single quiz result - must be before conditional returns
  const deleteResultMutation = useMutation({
    mutationFn: async (resultId: string) => {
      // TODO: Replace with Sanic API endpoint when quiz result deletion is implemented
      await apiFetch(`/api/v1/quiz-results/${resultId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-quiz-results', userId] });
      toast({ title: "Quiz result deleted", description: "The quiz result has been removed." });
      setDeleteResultDialog(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete single badge
  const deleteBadgeMutation = useMutation({
    mutationFn: async (badge: UserBadge) => {
      // TODO: Replace with Sanic API endpoint when badge deletion is implemented
      await apiFetch(`/api/v1/members/${userId}/badges/${badge.id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-badges-history', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-xp', userId] });
      toast({ title: "Badge removed", description: "The badge has been removed and XP adjusted." });
      setDeleteBadgeDialog(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Bulk delete quiz results
  const bulkDeleteMutation = useMutation({
    mutationFn: async () => {
      const resultIds = Array.from(selectedResults);
      const badgeIds = Array.from(selectedBadges);

      // Delete selected quiz results
      for (const resultId of resultIds) {
        await apiFetch(`/api/v1/quiz-results/${resultId}`, { method: 'DELETE' });
      }

      // Delete selected badges
      for (const badgeId of badgeIds) {
        await apiFetch(`/api/v1/members/${userId}/badges/${badgeId}`, { method: 'DELETE' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-quiz-results', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-badges-history', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-xp', userId] });
      toast({ 
        title: "Items deleted", 
        description: `Deleted ${selectedResults.size} quiz results and ${selectedBadges.size} badges.` 
      });
      setSelectedResults(new Set());
      setSelectedBadges(new Set());
      setBulkDeleteDialog(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Reset user XP completely — TODO: add reset endpoint to Sanic API
  const resetXPMutation = useMutation({
    mutationFn: async () => {
      // TODO: Replace with Sanic API endpoint when member reset endpoint is implemented
      await apiFetch(`/api/v1/members/${userId}/reset`, { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-quiz-results', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-badges-history', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-xp', userId] });
      toast({ 
        title: "User reset complete", 
        description: "All quiz results, badges, tags, and XP have been reset." 
      });
      setResetXPDialog(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Check access - must come AFTER all hooks but before rendering
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

  const isLoading = userLoading || resultsLoading || badgesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">User Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The user you're looking for doesn't exist or you don't have permission to view them.
        </p>
        <Button asChild>
          <Link href="/admin/users">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Link>
        </Button>
      </div>
    );
  }

  const getDisplayName = () => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user.username || 'Unknown User';
  };

  const getInitials = () => {
    const name = getDisplayName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  const stats = {
    totalQuizzes: quizResults.length,
    averageScore: quizResults.length > 0 
      ? Math.round(quizResults.reduce((sum, r) => sum + (r.score || 0), 0) / quizResults.length)
      : 0,
    totalBadges: badges.length,
    totalTimeSpent: quizResults.reduce((sum, r) => sum + (r.time_spent || 0), 0),
    currentXP: userXP?.total_xp || 0,
    currentLevel: userXP?.current_level || 1,
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreColor = (percentage: number | null) => {
    if (!percentage) return 'text-muted-foreground';
    if (percentage >= 80) return 'text-success';
    if (percentage >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const toggleResultSelection = (id: string) => {
    const newSet = new Set(selectedResults);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedResults(newSet);
  };

  const toggleBadgeSelection = (id: string) => {
    const newSet = new Set(selectedBadges);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedBadges(newSet);
  };

  const selectAllResults = () => {
    if (selectedResults.size === quizResults.length) {
      setSelectedResults(new Set());
    } else {
      setSelectedResults(new Set(quizResults.map(r => r.id)));
    }
  };

  const selectAllBadges = () => {
    if (selectedBadges.size === badges.length) {
      setSelectedBadges(new Set());
    } else {
      setSelectedBadges(new Set(badges.map(b => b.id)));
    }
  };

  const hasSelectedItems = selectedResults.size > 0 || selectedBadges.size > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/admin/users">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <History className="h-8 w-8" />
              User Activity
            </h1>
            <p className="text-muted-foreground">
              View and manage quiz history and achievements
            </p>
          </div>
        </div>
        
        {/* Admin Actions */}
        <div className="flex items-center gap-2">
          {hasSelectedItems && (
            <Button 
              variant="destructive" 
              onClick={() => setBulkDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected ({selectedResults.size + selectedBadges.size})
            </Button>
          )}
          <Button 
            variant="outline" 
            className="text-destructive border-destructive hover:bg-destructive/10"
            onClick={() => setResetXPDialog(true)}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset All
          </Button>
        </div>
      </div>

      {/* User Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatar_url || ''} />
              <AvatarFallback className="text-xl">{getInitials()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold">{getDisplayName()}</h2>
                <RoleBadge role={getRoleBadgeRole(user.role)} />
              </div>
              <p className="text-muted-foreground">@{user.username || 'no-username'}</p>
              {user.headline && (
                <p className="text-sm mt-1">{user.headline}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            {/* XP Info */}
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">{stats.currentXP} XP</p>
              <p className="text-sm text-muted-foreground">Level {stats.currentLevel}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.totalQuizzes}</p>
            <p className="text-xs text-muted-foreground">Quizzes Taken</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="mx-auto mb-2 h-8 w-8 text-success" />
            <p className="text-2xl font-bold">{stats.averageScore}%</p>
            <p className="text-xs text-muted-foreground">Average Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Award className="mx-auto mb-2 h-8 w-8 text-warning" />
            <p className="text-2xl font-bold">{stats.totalBadges}</p>
            <p className="text-xs text-muted-foreground">Badges Earned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="mx-auto mb-2 h-8 w-8 text-info" />
            <p className="text-2xl font-bold">{formatTime(stats.totalTimeSpent)}</p>
            <p className="text-xs text-muted-foreground">Total Time</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="quizzes">
        <TabsList>
          <TabsTrigger value="quizzes">
            <Trophy className="h-4 w-4 mr-2" />
            Quiz Results ({quizResults.length})
          </TabsTrigger>
          <TabsTrigger value="badges">
            <Award className="h-4 w-4 mr-2" />
            Badges ({badges.length})
          </TabsTrigger>
        </TabsList>

        {/* Quiz Results Tab */}
        <TabsContent value="quizzes" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Quiz History</CardTitle>
                <CardDescription>
                  All quizzes completed by this user
                </CardDescription>
              </div>
              {quizResults.length > 0 && (
                <Button variant="outline" size="sm" onClick={selectAllResults}>
                  {selectedResults.size === quizResults.length ? 'Deselect All' : 'Select All'}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {quizResults.length > 0 ? (
                <div className="rounded-none border-2 border-strong-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Quiz</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead className="hidden md:table-cell">Time Spent</TableHead>
                        <TableHead>Completed</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quizResults.map((result) => (
                        <TableRow key={result.id} className={selectedResults.has(result.id) ? 'bg-muted/50' : ''}>
                          <TableCell>
                            <Checkbox
                              checked={selectedResults.has(result.id)}
                              onCheckedChange={() => toggleResultSelection(result.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {result.quiz?.title || 'Unknown Quiz'}
                              </p>
                              {result.quiz?.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {result.quiz.description}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {result.score !== null ? (
                                <>
                                  <span className={`font-bold ${getScoreColor(result.score)}`}>
                                    {result.score}%
                                  </span>
                                  {result.score >= 80 ? (
                                    <CheckCircle2 className="h-4 w-4 text-success" />
                                  ) : result.score >= 60 ? (
                                    <CheckCircle2 className="h-4 w-4 text-warning" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-destructive" />
                                  )}
                                </>
                              ) : (
                                <Badge variant="outline">No Score</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {result.time_spent ? formatTime(result.time_spent) : '-'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(result.completed_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setSelectedResult(result)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeleteResultDialog(result)}
                              >
                                <Trash2 className="h-4 w-4" />
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
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    This user hasn't completed any quizzes yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value="badges" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Earned Badges</CardTitle>
                <CardDescription>
                  Badges and achievements earned by this user
                </CardDescription>
              </div>
              {badges.length > 0 && (
                <Button variant="outline" size="sm" onClick={selectAllBadges}>
                  {selectedBadges.size === badges.length ? 'Deselect All' : 'Select All'}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {badges.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {badges.map((badge) => (
                    <Card 
                      key={badge.id} 
                      className={`overflow-hidden relative ${selectedBadges.has(badge.id) ? 'ring-2 ring-primary' : ''}`}
                    >
                      <div className="absolute top-2 left-2">
                        <Checkbox
                          checked={selectedBadges.has(badge.id)}
                          onCheckedChange={() => toggleBadgeSelection(badge.id)}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteBadgeDialog(badge)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <CardContent className="p-4 pt-8 text-center">
                        <div 
                          className="mx-auto mb-3 flex h-16 w-16 items-center justify-center border border-strong-border text-3xl"
                          style={{ backgroundColor: `${badge.badge_color || '#6366f1'}20` }}
                        >
                          {badge.badge_icon || '🏅'}
                        </div>
                        <p className="font-medium">{badge.badge_name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Earned {new Date(badge.earned_at).toLocaleDateString()}
                        </p>
                        {badge.xp_reward && badge.xp_reward > 0 && (
                          <Badge variant="secondary" className="mt-2">
                            +{badge.xp_reward} XP
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    This user hasn't earned any badges yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Single Result Dialog */}
      <AlertDialog open={!!deleteResultDialog} onOpenChange={() => setDeleteResultDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Quiz Result
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this quiz result for "{deleteResultDialog?.quiz?.title}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteResultDialog && deleteResultMutation.mutate(deleteResultDialog.id)}
            >
              {deleteResultMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Single Badge Dialog */}
      <AlertDialog open={!!deleteBadgeDialog} onOpenChange={() => setDeleteBadgeDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Remove Badge
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the "{deleteBadgeDialog?.badge_name}" badge?
              {deleteBadgeDialog?.xp_reward && deleteBadgeDialog.xp_reward > 0 && (
                <span className="block mt-2 font-medium">
                  This will also deduct {deleteBadgeDialog.xp_reward} XP from the user.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteBadgeDialog && deleteBadgeMutation.mutate(deleteBadgeDialog)}
            >
              {deleteBadgeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={bulkDeleteDialog} onOpenChange={setBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Selected Items
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to delete:
              <ul className="list-disc ml-6 mt-2 space-y-1">
                {selectedResults.size > 0 && (
                  <li>{selectedResults.size} quiz result(s)</li>
                )}
                {selectedBadges.size > 0 && (
                  <li>{selectedBadges.size} badge(s)</li>
                )}
              </ul>
              <span className="block mt-2 font-medium">
                XP will be recalculated after badge removal. This cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => bulkDeleteMutation.mutate()}
            >
              {bulkDeleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete All Selected
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset All Dialog */}
      <AlertDialog open={resetXPDialog} onOpenChange={setResetXPDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <RotateCcw className="h-5 w-5" />
              Reset User Progress
            </AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold text-destructive">⚠️ This is a destructive action!</span>
              <span className="block mt-2">
                This will permanently delete ALL of the user's:
              </span>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Quiz results</li>
                <li>Earned badges</li>
                <li>Profile tags</li>
                <li>Achievements</li>
              </ul>
              <span className="block mt-2">
                The user's XP will be reset to 0 and level reset to 1.
              </span>
              <span className="block mt-2 font-semibold">
                This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => resetXPMutation.mutate()}
            >
              {resetXPMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Reset Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Answers Dialog */}
      <Dialog open={!!selectedResult} onOpenChange={(open) => !open && setSelectedResult(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Quiz Answers - {selectedResult?.quiz?.title}
            </DialogTitle>
            <DialogDescription>
              Completed on {selectedResult ? new Date(selectedResult.completed_at).toLocaleDateString() : ''} 
              {' • '} Score: {selectedResult?.score}%
              {selectedResult?.is_passed !== null && (
                <Badge className="ml-2" variant={selectedResult?.is_passed ? "default" : "destructive"}>
                  {selectedResult?.is_passed ? "Passed" : "Failed"}
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              {selectedResult && (() => {
                const surveyDef = selectedResult.quiz?.survey_json as any;
                const surveyResults = selectedResult.survey_results as Record<string, any> || {};
                const questions: any[] = [];
                
                if (surveyDef?.pages && Array.isArray(surveyDef.pages)) {
                  for (const page of surveyDef.pages) {
                    if (page.elements && Array.isArray(page.elements)) {
                      for (const element of page.elements) {
                        questions.push(element);
                      }
                    }
                  }
                }

                if (questions.length === 0 && surveyDef?.elements && Array.isArray(surveyDef.elements)) {
                  questions.push(...surveyDef.elements);
                }

                if (questions.length === 0) {
                  return (
                    <p className="text-muted-foreground text-center py-8">
                      No questions found in quiz definition
                    </p>
                  );
                }

                return questions.map((q, index) => {
                  const userAnswer = surveyResults[q.name];
                  const correctAnswer = q.correctAnswer;
                  const hasCorrectAnswer = correctAnswer !== undefined;
                  const isCorrect = hasCorrectAnswer && 
                    String(userAnswer).trim().toLowerCase() === String(correctAnswer).trim().toLowerCase();

                  return (
                    <div
                      key={q.name || index}
                      className="space-y-3 border border-strong-border p-5"
                    >
                      <div className="flex items-start gap-3">
                        {hasCorrectAnswer ? (
                          isCorrect ? (
                            <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
                          ) : (
                            <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                          )
                        ) : (
                          <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center border border-strong-border bg-muted text-xs">
                            {index + 1}
                          </div>
                        )}
                        <div className="flex-1 space-y-2">
                          <p className="font-medium">{q.title || q.name}</p>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-start gap-2">
                              <span className="text-muted-foreground min-w-[100px]">Answer:</span>
                              <span className={hasCorrectAnswer ? (isCorrect ? "font-medium text-success" : "font-medium text-destructive") : "font-medium"}>
                                {userAnswer !== undefined ? (
                                  Array.isArray(userAnswer) ? userAnswer.join(', ') : String(userAnswer)
                                ) : (
                                  <span className="text-muted-foreground italic">No answer</span>
                                )}
                              </span>
                            </div>
                            {hasCorrectAnswer && !isCorrect && (
                              <div className="flex items-start gap-2">
                                <span className="text-muted-foreground min-w-[100px]">Correct:</span>
                                <span className="font-medium text-success">{String(correctAnswer)}</span>
                              </div>
                            )}
                          </div>
                          {q.choices && Array.isArray(q.choices) && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              <span>Options: </span>
                              {q.choices.map((choice: any, i: number) => (
                                <span key={i}>
                                  {typeof choice === 'object' ? choice.text || choice.value : choice}
                                  {i < q.choices.length - 1 && ', '}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
