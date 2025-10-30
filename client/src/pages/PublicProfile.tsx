import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/RoleBadge";
import { ArrowLeft, Shield, Sparkles, Heart, TrendingUp, Target, Brain } from "lucide-react";
import type { UserProfileData, UserBadge, UserTag, UserPrivacySettings } from "@shared/schema";

interface PublicProfileData {
  user?: {
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
    bio?: string;
    role?: string;
    createdAt?: string;
  };
  profileData: UserProfileData | null;
  badges: UserBadge[];
  tags: UserTag[];
  privacy: UserPrivacySettings | null;
}

export default function PublicProfile() {
  const [, params] = useRoute("/profile/:userId");
  const userId = params?.userId;

  const { data, isLoading } = useQuery<PublicProfileData>({
    queryKey: ["/api/profile", userId],
    queryFn: async () => {
      const response = await fetch(`/api/profile/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      return response.json();
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="py-12">
            <p className="text-muted-foreground text-center">Loading profile...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data?.user) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="py-12">
            <p className="text-muted-foreground text-center">Profile not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName = data.user
    ? `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim() || data.user.email || ""
    : "";
  const displayBio = data.user?.bio || "No bio added yet.";

  const getRoleBadgeRole = (role?: string): "Admin" | "Facilitator" | "Contributor" | "Viewer" => {
    if (!role) return "Viewer";
    return (role.charAt(0).toUpperCase() + role.slice(1)) as "Admin" | "Facilitator" | "Contributor" | "Viewer";
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Public Profile</h1>
            <p className="text-muted-foreground mt-1">
              View {displayName}'s profile
            </p>
          </div>
        </div>
      </div>

      <Card data-testid="card-user-info">
        <CardContent className="pt-6">
          <div className="flex items-start gap-6 flex-wrap">
            <Avatar className="h-20 w-20">
              <AvatarImage src={data.user?.profileImageUrl} />
              <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <div>
                <h2 className="text-2xl font-bold" data-testid="text-profile-name">{displayName}</h2>
                {data.privacy?.isProfilePublic && data.user?.email && (
                  <p className="text-muted-foreground">{data.user.email}</p>
                )}
              </div>
              <p className="text-sm">{displayBio}</p>
              <div className="flex gap-4 flex-wrap items-center">
                <RoleBadge role={getRoleBadgeRole(data.user?.role)} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {data.badges.length > 0 && (
        <Card data-testid="card-badges">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Badges
            </CardTitle>
            <CardDescription>Achievements earned through quizzes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.badges.map((badge) => (
                <div
                  key={badge.id}
                  className="p-4 rounded-lg border"
                  data-testid={`badge-${badge.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{badge.badgeName}</h3>
                      {badge.badgeDescription && (
                        <p className="text-xs text-muted-foreground truncate">
                          {badge.badgeDescription}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.tags.length > 0 && (
        <Card data-testid="card-tags">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Tags
            </CardTitle>
            <CardDescription>Profile attributes from quiz results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.tags.slice(0, 50).map((tag, index) => (
                <Badge key={index} variant="secondary" data-testid={`tag-${index}`}>
                  {tag.tagValue}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.badges.length === 0 && data.tags.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <p className="text-muted-foreground text-center">
              This user has not made their profile data public yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
