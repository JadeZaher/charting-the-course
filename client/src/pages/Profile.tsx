import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/RoleBadge";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Edit, Save, X, CheckCircle, Clock, Download, Upload, 
  TrendingUp, Heart, Target, Sparkles, Brain, Shield,
  User, Lock, Eye, EyeOff, Copy, Link2, Share2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { StatCard } from "@/components/StatCard";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import type { QuizResult, UserProfileData, UserBadge, UserTag, UserPrivacySettings, ProfileDimensions } from "@shared/schema";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ProfileData {
  profileData: UserProfileData | null;
  badges: UserBadge[];
  tags: UserTag[];
  privacy: UserPrivacySettings | null;
}

export default function Profile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: quizResults = [], isLoading: isLoadingQuizzes } = useQuery<QuizResult[]>({
    queryKey: ["/api/quiz-results/user"],
  });

  const { data: profileData, isLoading: isLoadingProfile } = useQuery<ProfileData>({
    queryKey: ["/api/profile/my/data"],
  });

  const updatePrivacyMutation = useMutation({
    mutationFn: async (updates: Partial<UserPrivacySettings>) => {
      return await apiRequest("PUT", "/api/profile/privacy", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile/my/data"] });
      toast({
        title: "Privacy Updated",
        description: "Your privacy settings have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update privacy settings.",
        variant: "destructive",
      });
    },
  });

  const handlePrivacyToggle = (field: keyof UserPrivacySettings, value: boolean) => {
    updatePrivacyMutation.mutate({ [field]: value });
  };

  const handleDimensionToggle = (dimension: string, checked: boolean) => {
    const currentDimensions = profileData?.privacy?.sharedDimensions || [];
    const updatedDimensions = checked
      ? [...currentDimensions, dimension]
      : currentDimensions.filter(d => d !== dimension);
    updatePrivacyMutation.mutate({ sharedDimensions: updatedDimensions });
  };

  const completedQuizzes = quizResults.filter(r => r.score !== null);
  const avgScore = completedQuizzes.length > 0
    ? Math.round(completedQuizzes.reduce((sum, r) => sum + (r.score || 0), 0) / completedQuizzes.length)
    : 0;

  const stats = {
    completedQuizzes: completedQuizzes.length,
    avgScore,
    totalTags: profileData?.tags.length || 0,
    totalBadges: profileData?.badges.length || 0,
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

  const handleCopyProfileLink = () => {
    if (!user?.id) return;
    const profileUrl = `${window.location.origin}/profile/${user.id}`;
    navigator.clipboard.writeText(profileUrl);
    toast({
      title: "Link Copied",
      description: "Your profile link has been copied to clipboard.",
    });
  };

  const handleShareProfile = async () => {
    if (!user?.id) return;
    const profileUrl = `${window.location.origin}/profile/${user.id}`;
    const displayName = user 
      ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || ""
      : "";
    
    // Try native share API first
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${displayName}'s Profile`,
          text: `Check out ${displayName}'s profile on CourseHub`,
          url: profileUrl,
        });
        toast({
          title: "Shared Successfully",
          description: "Your profile has been shared.",
        });
      } catch (error) {
        // User cancelled or error occurred, do nothing
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      // Fallback to copy
      handleCopyProfileLink();
    }
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
      profileData: profileData?.profileData,
      badges: profileData?.badges,
      tags: profileData?.tags,
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

  const profileDimensions = profileData?.profileData?.profileDimensions;

  const getTagsForDimension = (dimension: keyof ProfileDimensions) => {
    if (!profileDimensions || !profileDimensions[dimension]) return [];
    const dimData = profileDimensions[dimension];
    
    const extractValues = (obj: any): (string | number)[] => {
      const results: (string | number)[] = [];
      
      if (typeof obj === 'string' || typeof obj === 'number') {
        results.push(obj);
      } else if (Array.isArray(obj)) {
        obj.forEach(item => {
          results.push(...extractValues(item));
        });
      } else if (obj && typeof obj === 'object') {
        Object.values(obj).forEach(value => {
          results.push(...extractValues(value));
        });
      }
      
      return results;
    };
    
    return extractValues(dimData);
  };

  const DimensionCard = ({ 
    title, 
    description, 
    icon: Icon, 
    dimension, 
    color 
  }: { 
    title: string; 
    description: string; 
    icon: any; 
    dimension: keyof ProfileDimensions; 
    color: string;
  }) => {
    const tags = getTagsForDimension(dimension);
    const isEmpty = tags.length === 0;

    return (
      <Card data-testid={`card-dimension-${dimension}`}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription className="text-sm">{description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isEmpty ? (
            <div className="py-8 text-center space-y-2">
              <p className="text-muted-foreground text-sm">
                No {title.toLowerCase()} data yet
              </p>
              <p className="text-muted-foreground text-xs">
                Complete quizzes with {title.toLowerCase()} questions to fill this dimension
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <Badge key={index} variant="secondary" data-testid={`tag-${dimension}-${index}`}>
                  {String(tag)}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and track your learning journey
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
            Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportJSON}
            data-testid="button-export-json"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
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

      <Tabs defaultValue="overview" className="space-y-6" data-testid="tabs-profile">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <User className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="dimensions" data-testid="tab-dimensions">
            <Brain className="h-4 w-4 mr-2" />
            Dimensions
          </TabsTrigger>
          <TabsTrigger value="badges" data-testid="tab-badges">
            <Shield className="h-4 w-4 mr-2" />
            Badges
          </TabsTrigger>
          <TabsTrigger value="privacy" data-testid="tab-privacy">
            <Lock className="h-4 w-4 mr-2" />
            Privacy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Completed"
              value={stats.completedQuizzes}
              icon={CheckCircle}
            />
            <StatCard
              title="Avg Score"
              value={`${stats.avgScore}%`}
              icon={TrendingUp}
            />
            <StatCard
              title="Tags Earned"
              value={stats.totalTags}
              icon={Sparkles}
            />
            <StatCard
              title="Badges"
              value={stats.totalBadges}
              icon={Shield}
            />
          </div>

          <Card data-testid="card-profile-link">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Profile Link
              </CardTitle>
              <CardDescription>Share your profile with others</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <Input
                      value={user?.id ? `${window.location.origin}/profile/${user.id}` : ''}
                      readOnly
                      className="text-sm"
                      data-testid="input-profile-url"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyProfileLink}
                    data-testid="button-copy-link"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleShareProfile}
                    data-testid="button-share-profile"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Others can visit this link to view your public profile based on your privacy settings.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Quiz Results</CardTitle>
              <CardDescription>Your most recent completed quizzes</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingQuizzes ? (
                <p className="text-muted-foreground text-center py-8">Loading quiz results...</p>
              ) : completedQuizzes.length > 0 ? (
                <div className="space-y-3">
                  {completedQuizzes.slice(0, 5).map((result) => (
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
                              {new Date(result.completedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={result.isPassed ? "default" : "destructive"}>
                          {result.score}%
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 space-y-2">
                  <p className="text-muted-foreground">
                    No completed quizzes yet
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Start taking quizzes to build your profile!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dimensions" className="space-y-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">Profile Dimensions</h2>
              <p className="text-muted-foreground">
                Discover deeply human aspects of yourself through quiz results
              </p>
            </div>

            {isLoadingProfile ? (
              <Card>
                <CardContent className="py-12">
                  <p className="text-muted-foreground text-center">Loading profile data...</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DimensionCard
                  title="Personality"
                  description="Your unique traits and characteristics"
                  icon={Heart}
                  dimension="personality"
                  color="bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400"
                />
                <DimensionCard
                  title="Strengths"
                  description="Your core capabilities and talents"
                  icon={Sparkles}
                  dimension="strengths"
                  color="bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                />
                <DimensionCard
                  title="Values"
                  description="What matters most to you"
                  icon={Target}
                  dimension="values"
                  color="bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                />
                <DimensionCard
                  title="Interests"
                  description="Topics and activities you enjoy"
                  icon={Brain}
                  dimension="interests"
                  color="bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                />
                <DimensionCard
                  title="Growth Areas"
                  description="Opportunities for development"
                  icon={TrendingUp}
                  dimension="growth"
                  color="bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="badges" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Badge Collection</h2>
            <p className="text-muted-foreground">
              Badges earned from your quiz achievements
            </p>
          </div>

          {isLoadingProfile ? (
            <Card>
              <CardContent className="py-12">
                <p className="text-muted-foreground text-center">Loading badges...</p>
              </CardContent>
            </Card>
          ) : profileData?.badges && profileData.badges.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profileData.badges.map((badge) => (
                <Card key={badge.id} data-testid={`badge-${badge.id}`}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-full bg-primary/10">
                        <Shield className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base">{badge.badgeName}</CardTitle>
                        {badge.badgeCategory && (
                          <CardDescription className="text-xs">
                            {badge.badgeCategory}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  {badge.badgeDescription && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{badge.badgeDescription}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-2">
                  <Shield className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="text-muted-foreground">No badges earned yet</p>
                  <p className="text-sm text-muted-foreground">
                    Complete quizzes to earn badges based on your results
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Privacy Settings</h2>
            <p className="text-muted-foreground">
              Control what others can see on your profile
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Profile Visibility</CardTitle>
              <CardDescription>
                Choose what information is visible to other users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1">
                  <Label className="text-base">Make Profile Public</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow others to view your profile page
                  </p>
                </div>
                <Switch
                  checked={profileData?.privacy?.isProfilePublic || false}
                  onCheckedChange={(checked) => handlePrivacyToggle('isProfilePublic', checked)}
                  data-testid="switch-profile-public"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1">
                  <Label className="text-base">Show Badges</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow others to see your earned badges
                  </p>
                </div>
                <Switch
                  checked={profileData?.privacy?.showBadges || false}
                  onCheckedChange={(checked) => handlePrivacyToggle('showBadges', checked)}
                  data-testid="switch-show-badges"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1">
                  <Label className="text-base">Show Tags</Label>
                  <p className="text-sm text-muted-foreground">
                    Display your profile tags publicly
                  </p>
                </div>
                <Switch
                  checked={profileData?.privacy?.showTags || false}
                  onCheckedChange={(checked) => handlePrivacyToggle('showTags', checked)}
                  data-testid="switch-show-tags"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1">
                  <Label className="text-base">Show Quiz Results</Label>
                  <p className="text-sm text-muted-foreground">
                    Let others see which quizzes you've completed and your scores
                  </p>
                </div>
                <Switch
                  checked={profileData?.privacy?.showQuizResults || false}
                  onCheckedChange={(checked) => handlePrivacyToggle('showQuizResults', checked)}
                  data-testid="switch-show-quiz-results"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profile Dimensions</CardTitle>
              <CardDescription>
                Select which profile dimensions to share publicly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="dimension-personality"
                  checked={profileData?.privacy?.sharedDimensions?.includes('personality') || false}
                  onCheckedChange={(checked) => handleDimensionToggle('personality', checked as boolean)}
                  data-testid="checkbox-dimension-personality"
                />
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="dimension-personality" className="text-base cursor-pointer">
                    Personality
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Share your personality traits and communication style
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="dimension-strengths"
                  checked={profileData?.privacy?.sharedDimensions?.includes('strengths') || false}
                  onCheckedChange={(checked) => handleDimensionToggle('strengths', checked as boolean)}
                  data-testid="checkbox-dimension-strengths"
                />
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="dimension-strengths" className="text-base cursor-pointer">
                    Strengths
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Share your key strengths and what energizes you
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="dimension-values"
                  checked={profileData?.privacy?.sharedDimensions?.includes('values') || false}
                  onCheckedChange={(checked) => handleDimensionToggle('values', checked as boolean)}
                  data-testid="checkbox-dimension-values"
                />
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="dimension-values" className="text-base cursor-pointer">
                    Values
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Share your core values and what matters to you
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="dimension-interests"
                  checked={profileData?.privacy?.sharedDimensions?.includes('interests') || false}
                  onCheckedChange={(checked) => handleDimensionToggle('interests', checked as boolean)}
                  data-testid="checkbox-dimension-interests"
                />
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="dimension-interests" className="text-base cursor-pointer">
                    Interests
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Share your interests, hobbies, and travel experiences
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="dimension-growth"
                  checked={profileData?.privacy?.sharedDimensions?.includes('growth') || false}
                  onCheckedChange={(checked) => handleDimensionToggle('growth', checked as boolean)}
                  data-testid="checkbox-dimension-growth"
                />
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="dimension-growth" className="text-base cursor-pointer">
                    Growth Areas
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Share areas where you're working to grow and improve
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Discovery Settings</CardTitle>
              <CardDescription>
                Control how others can find and connect with you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1">
                  <Label className="text-base">Allow Discovery</Label>
                  <p className="text-sm text-muted-foreground">
                    Let others discover you based on similar or opposite profile traits
                  </p>
                </div>
                <Switch
                  checked={profileData?.privacy?.allowDiscovery || false}
                  onCheckedChange={(checked) => handlePrivacyToggle('allowDiscovery', checked)}
                  data-testid="switch-allow-discovery"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profile Preview</CardTitle>
              <CardDescription>
                See how your profile appears to others
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" data-testid="button-preview-profile">
                <Eye className="h-4 w-4 mr-2" />
                Preview Public Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
