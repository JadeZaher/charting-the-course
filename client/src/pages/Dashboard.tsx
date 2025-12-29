import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { BookOpen, Map, User, Shield, Video, ArrowRight, FileEdit, Award, TrendingUp } from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useRoleAccess } from "@/hooks/useRoleAccess";
// TODO: Enable when Edge Functions are deployed
// import { useUserProgress } from "@/hooks/useAchievements";

export default function Dashboard() {
  const { user } = useSupabaseAuth();
  const { permissions, roleName } = useRoleAccess();
  // TODO: Enable when Edge Functions are deployed
  // const { xpLevel, currentLevel, recentAchievements } = useUserProgress(undefined, true);
  const xpLevel = null;
  const currentLevel = null;
  const recentAchievements: unknown[] = [];

  // Get display name
  const firstName = user?.user_metadata?.first_name || '';
  const lastName = user?.user_metadata?.last_name || '';
  const displayName = `${firstName} ${lastName}`.trim() || user?.email?.split('@')[0] || 'User';

  // Base navigation cards for all users
  const navigationCards = [
    {
      title: "Quizzes",
      description: "Take quizzes about collaboration styles and view your results",
      icon: BookOpen,
      href: "/quizzes",
      testId: "card-nav-quizzes",
    },
    {
      title: "Map View",
      description: "Explore global collaborative mindmaps from webinars",
      icon: Map,
      href: "/map",
      testId: "card-nav-map",
    },
    {
      title: "Profile",
      description: "View your progress, badges, achievements, and personal stats",
      icon: User,
      href: "/profile",
      testId: "card-nav-profile",
    },
  ];

  // Add quiz management for facilitators and admins
  if (permissions.canCreateQuizzes) {
    navigationCards.push({
      title: "Manage Quizzes",
      description: "Create, edit, and manage your quizzes",
      icon: FileEdit,
      href: "/quiz/manage",
      testId: "card-nav-quiz-manage",
    });
  }

  // Add admin panel for admins
  if (permissions.canAccessAdminPanel) {
    navigationCards.push({
      title: "Admin Panel",
      description: "Manage users, roles, badges, and platform settings",
      icon: Shield,
      href: "/admin",
      testId: "card-nav-admin",
    });
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Welcome Section */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold" data-testid="text-welcome-title">
          Welcome back, {displayName}!
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl" data-testid="text-welcome-description">
          You're logged in as <span className="font-medium text-foreground">{roleName}</span>.
          {permissions.isAdminOrFacilitator 
            ? " You have access to quiz creation and management tools."
            : " Explore quizzes and track your progress."
          }
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                {currentLevel?.level_icon || '🌱'}
              </div>
              <div>
                <p className="text-2xl font-bold">{currentLevel?.level_name || 'Newcomer'}</p>
                <p className="text-sm text-muted-foreground">Level {xpLevel?.current_level || 1}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{xpLevel?.total_xp || 0} XP</p>
                <p className="text-sm text-muted-foreground">
                  {xpLevel?.xp_to_next_level || 100} to next level
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{recentAchievements?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Recent Achievements</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Video Section */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Featured Webinar
          </CardTitle>
          <CardDescription>
            Watch our latest collaborative webinar session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className="aspect-video bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border"
            data-testid="placeholder-video"
          >
            <div className="text-center space-y-2">
              <Video className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Video content will be embedded here
              </p>
              <p className="text-xs text-muted-foreground">
                iframe or video player placeholder
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Cards */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Quick Navigation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {navigationCards.map((card) => (
            <Link 
              key={card.href} 
              href={card.href}
              data-testid={`link-nav-${card.title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <Card 
                className="hover:shadow-lg cursor-pointer h-full transition-all hover:border-primary/50"
                data-testid={card.testId}
              >
                <CardHeader className="space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <card.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="text-lg">{card.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {card.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-muted-foreground group">
                    <span>Go to {card.title}</span>
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Platform Info */}
      <Card>
        <CardHeader>
          <CardTitle>About Charting the Course</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Charting the Course is designed for participants who have attended our collaborative webinars. 
            Here you can deepen your understanding of collaboration styles through interactive quizzes, 
            explore global mindmaps created during sessions, and track your learning journey.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="space-y-1">
              <h4 className="font-medium text-sm">Interactive Quizzes</h4>
              <p className="text-xs text-muted-foreground">
                Take quizzes or upload your results to track your collaboration style
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="font-medium text-sm">Badges & Achievements</h4>
              <p className="text-xs text-muted-foreground">
                Earn badges and level up as you complete quizzes and activities
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="font-medium text-sm">Role-Based Access</h4>
              <p className="text-xs text-muted-foreground">
                Different features available for Admins, Facilitators, Contributors, and Viewers
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
