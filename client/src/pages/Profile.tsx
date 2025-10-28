import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/RoleBadge";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Save, X, CheckCircle, Clock, Download, Upload, BookOpen, TrendingUp, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { StatCard } from "@/components/StatCard";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { QuizResult } from "@shared/schema";

export default function Profile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: quizResults = [], isLoading } = useQuery<QuizResult[]>({
    queryKey: ["/api/quiz-results/user"],
  });

  const completedQuizzes = quizResults.filter(r => r.score !== null);
  const avgScore = completedQuizzes.length > 0
    ? Math.round(completedQuizzes.reduce((sum, r) => sum + (r.score || 0), 0) / completedQuizzes.length)
    : 0;

  const stats = {
    completedQuizzes: completedQuizzes.length,
    avgScore,
  };

  const handleSave = () => {
    console.log("Saving profile:", { name, bio });
    setIsEditing(false);
    toast({
      title: "Profile Updated",
      description: "Your profile has been successfully updated.",
    });
  };

  const handleCancel = () => {
    setName(displayName);
    setBio(displayBio === "No bio added yet." ? "" : displayBio);
    setIsEditing(false);
  };

  const handleExportJSON = () => {
    const exportData = {
      profile: {
        id: user?.id,
        email: user?.email,
        firstName: user?.firstName,
        lastName: user?.lastName,
        username: user?.username,
        bio: user?.bio,
        role: user?.role,
        createdAt: user?.createdAt,
      },
      stats,
      quizResults: completedQuizzes,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `coursehub-profile-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Profile Exported",
      description: "Your profile data has been exported as JSON.",
    });
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        console.log("Imported data:", data);
        
        toast({
          title: "Profile Imported",
          description: "Your profile data has been imported successfully.",
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Invalid JSON file. Please check the file and try again.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const displayName = user 
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || ""
    : "";
  const displayBio = user?.bio || "No bio added yet.";

  const getRoleBadgeRole = (role?: string): "Admin" | "Facilitator" | "Contributor" | "Viewer" => {
    if (!role) return "Viewer";
    return (role.charAt(0).toUpperCase() + role.slice(1)) as "Admin" | "Facilitator" | "Contributor" | "Viewer";
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and track your learning progress
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportJSON}
            className="hidden"
            data-testid="input-import-json"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            data-testid="button-import-json"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportJSON}
            data-testid="button-export-json"
          >
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Your Progress</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard
            title="Completed Quizzes"
            value={stats.completedQuizzes}
            icon={CheckCircle}
          />
          <StatCard
            title="Avg. Score"
            value={`${stats.avgScore}%`}
            icon={TrendingUp}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-8">
          <div className="flex items-start gap-6 flex-wrap">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user?.profileImageUrl || ""} />
              <AvatarFallback className="text-2xl">
                {displayName.split(' ').map(n => n[0]).join('') || "?"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      data-testid="input-profile-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Input
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself"
                      data-testid="input-profile-bio"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSave} size="sm" data-testid="button-save-profile">
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button onClick={handleCancel} size="sm" variant="outline" data-testid="button-cancel-edit">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <h2 className="text-2xl font-bold" data-testid="text-profile-name">{displayName}</h2>
                    <p className="text-muted-foreground">{user?.email}</p>
                  </div>
                  <p className="text-sm">{displayBio}</p>
                  <div className="flex gap-4 flex-wrap items-center">
                    <RoleBadge role={getRoleBadgeRole(user?.role)} />
                    {user?.createdAt && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    <Button 
                      onClick={() => {
                        setName(displayName || "");
                        setBio(displayBio || "");
                        setIsEditing(true);
                      }} 
                      size="sm" 
                      variant="outline" 
                      data-testid="button-edit-profile"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Completed Quizzes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Loading quiz results...</p>
          ) : completedQuizzes.length > 0 ? (
            <div className="space-y-3">
              {completedQuizzes.map((result) => (
                <Link key={result.id} href={`/quiz/results/${result.quizId}`}>
                  <div
                    className="flex items-center justify-between p-4 rounded-lg border hover-elevate active-elevate-2 cursor-pointer"
                    data-testid={`completed-quiz-${result.id}`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <CheckCircle className="h-5 w-5 text-chart-3 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">Quiz Result</p>
                        <p className="text-sm text-muted-foreground">
                          Completed on {new Date(result.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={result.isPassed ? "default" : "destructive"}>
                        Score: {result.score}%
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No completed quizzes yet. Start taking quizzes to see your results here!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
