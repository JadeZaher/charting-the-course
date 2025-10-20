import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/RoleBadge";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Save, X, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// TODO: remove mock functionality
const mockUser = {
  name: "Jane Doe",
  email: "jane.doe@example.com",
  role: "Admin" as const,
  avatar: "",
  joinedDate: "2023-06-15",
  bio: "Passionate about collaborative learning and team development.",
};

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
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(mockUser.name);
  const [bio, setBio] = useState(mockUser.bio);
  const { toast } = useToast();

  const handleSave = () => {
    console.log("Saving profile:", { name, bio });
    setIsEditing(false);
    toast({
      title: "Profile Updated",
      description: "Your profile has been successfully updated.",
    });
  };

  const handleCancel = () => {
    setName(mockUser.name);
    setBio(mockUser.bio);
    setIsEditing(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and track your learning progress
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-8">
          <div className="flex items-start gap-6 flex-wrap">
            <Avatar className="h-24 w-24">
              <AvatarImage src={mockUser.avatar} />
              <AvatarFallback className="text-2xl">
                {mockUser.name.split(' ').map(n => n[0]).join('')}
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
                      data-testid="input-profile-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Input
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
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
                    <h2 className="text-2xl font-bold" data-testid="text-profile-name">{name}</h2>
                    <p className="text-muted-foreground">{mockUser.email}</p>
                  </div>
                  <p className="text-sm">{bio}</p>
                  <div className="flex gap-4 flex-wrap items-center">
                    <RoleBadge role={mockUser.role} />
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Joined {new Date(mockUser.joinedDate).toLocaleDateString()}</span>
                    </div>
                    <Button onClick={() => setIsEditing(true)} size="sm" variant="outline" data-testid="button-edit-profile">
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
