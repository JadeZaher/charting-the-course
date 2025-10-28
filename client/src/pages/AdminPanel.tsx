import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoleBadge } from "@/components/RoleBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, Users, ListChecks, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { User, Quiz } from "@shared/schema";

type Role = "Admin" | "Facilitator" | "Contributor" | "Viewer";

const getRoleBadgeRole = (role?: string): Role => {
  if (!role) return "Viewer";
  return (role.charAt(0).toUpperCase() + role.slice(1)) as Role;
};

export default function AdminPanel() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: quizzes = [], isLoading: quizzesLoading } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes"],
  });

  const filteredUsers = users.filter(
    (user) =>
      (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.firstName && user.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.lastName && user.lastName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeQuizzes = quizzes.filter((q) => q.isPublished);
  const quizCreators = users.filter((u) => u.role === "admin" || u.role === "facilitator");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Control Panel</h1>
        <p className="text-muted-foreground mt-1">
          Manage users, quizzes, and platform statistics
        </p>
      </div>

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
                <div className="text-2xl font-bold" data-testid="stat-facilitators">
                  {quizCreators.length}
                </div>
                <div className="text-sm text-muted-foreground">Quiz Creators</div>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users" data-testid="tab-users">
            Users
          </TabsTrigger>
          <TabsTrigger value="quizzes" data-testid="tab-quizzes">
            Quizzes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <CardTitle>User Management</CardTitle>
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-users"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <p className="text-muted-foreground text-center py-8">Loading users...</p>
              ) : filteredUsers.length > 0 ? (
                <div className="space-y-3">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                      data-testid={`user-row-${user.id}`}
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <p className="font-medium truncate">
                            {user.firstName || user.lastName 
                              ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                              : user.email}
                          </p>
                          <RoleBadge role={getRoleBadgeRole(user.role)} />
                          {(user.role === "admin" || user.role === "facilitator") && (
                            <Badge variant="outline">Quiz Creator</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
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
        </TabsContent>

        <TabsContent value="quizzes" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <CardTitle>Quiz Management</CardTitle>
                <Link href="/quiz/manage">
                  <Button data-testid="button-manage-quizzes">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Manage Quizzes
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {quizzesLoading ? (
                <p className="text-muted-foreground text-center py-8">Loading quizzes...</p>
              ) : quizzes.length > 0 ? (
                <div className="space-y-3">
                  {quizzes.map((quiz) => (
                    <div
                      key={quiz.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                      data-testid={`quiz-row-${quiz.id}`}
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <p className="font-medium truncate">{quiz.title}</p>
                          <Badge variant={quiz.isPublished ? "default" : "outline"}>
                            {quiz.isPublished ? "Published" : "Draft"}
                          </Badge>
                          <Badge variant="secondary">{quiz.visibility}</Badge>
                        </div>
                        {quiz.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {quiz.description}
                          </p>
                        )}
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
      </Tabs>
    </div>
  );
}
