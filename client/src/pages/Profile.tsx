import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/RoleBadge";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Save, X, CheckCircle, Clock, Download, Upload, BookOpen, Users, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { StatCard } from "@/components/StatCard";

// TODO: replace with actual data from API
const mockCompletedQuizzes = [
  { id: "1", title: "Communication Skills", score: 88, completedAt: "2024-01-15" },
  { id: "2", title: "Conflict Resolution", score: 92, completedAt: "2024-01-10" },
  { id: "3", title: "Time Management", score: 85, completedAt: "2024-01-05" },
];

const mockInProgressQuizzes = [
  { id: "4", title: "Leadership Essentials", progress: 65 },
  { id: "5", title: "Foundations of Cooperation", progress: 40 },
];

export default function Profile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // TODO: Replace with actual data from API
  const stats = {
    activeCourses: 5,
    completedQuizzes: 12,
    teamMembers: 24,
    avgScore: 85,
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
      completedQuizzes: mockCompletedQuizzes,
      inProgressQuizzes: mockInProgressQuizzes,
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
        
        // TODO: Validate and process imported data
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

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const displayName = user 
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || ""
    : "";
  const displayBio = user?.bio || "No bio added yet.";

  // Convert lowercase UserRole to capitalized Role for RoleBadge
  const getRoleBadgeRole = (role?: string): "Admin" | "Facilitator" | "Contributor" | "Viewer" => {
    if (!role) return "Viewer";
    return (role.charAt(0).toUpperCase() + role.slice(1)) as "Admin" | "Facilitator" | "Contributor" | "Viewer";
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
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

      {/* Personal Stats */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Progress</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Active Courses"
            value={stats.activeCourses}
            icon={BookOpen}
            trend={{ value: 2, isPositive: true }}
          />
          <StatCard
            title="Completed Quizzes"
            value={stats.completedQuizzes}
            icon={CheckCircle}
            trend={{ value: 3, isPositive: true }}
          />
          <StatCard
            title="Team Members"
            value={stats.teamMembers}
            icon={Users}
          />
          <StatCard
            title="Avg. Score"
            value={`${stats.avgScore}%`}
            icon={TrendingUp}
            trend={{ value: 5, isPositive: true }}
          />
        </div>
      </div>

      {/* Profile Card */}
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

      {/* Quiz History */}
      <Tabs defaultValue="completed">
        <TabsList>
          <TabsTrigger value="completed" data-testid="tab-completed-quizzes">
            Completed Quizzes
          </TabsTrigger>
          <TabsTrigger value="in-progress" data-testid="tab-progress-quizzes">
            In Progress
          </TabsTrigger>
        </TabsList>

        <TabsContent value="completed" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Completed Quizzes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockCompletedQuizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
                    data-testid={`completed-quiz-${quiz.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-chart-3" />
                      <div>
                        <p className="font-medium">{quiz.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Completed on {new Date(quiz.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="default">Score: {quiz.score}%</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="in-progress" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockInProgressQuizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="p-4 rounded-lg border space-y-2"
                    data-testid={`progress-quiz-${quiz.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{quiz.title}</p>
                      <span className="text-sm font-medium">{quiz.progress}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${quiz.progress}%` }}
                        />
                      </div>
                      <Button size="sm" variant="outline" data-testid={`button-continue-${quiz.id}`}>
                        Continue
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
