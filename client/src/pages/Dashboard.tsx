import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { BookOpen, Map, User, Shield, Video, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user && user.role === "admin";

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
      description: "View your progress, completed quizzes, and personal stats",
      icon: User,
      href: "/profile",
      testId: "card-nav-profile",
    },
  ];

  if (isAdmin) {
    navigationCards.push({
      title: "Admin Panel",
      description: "Manage users, quizzes, and platform settings",
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
          Welcome to CourseHub
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl" data-testid="text-welcome-description">
          A post-webinar learning platform where you can explore collaboration styles, 
          take interactive quizzes, and view global collaborative mindmaps created during our webinars.
        </p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {navigationCards.map((card) => (
            <Link 
              key={card.href} 
              href={card.href}
              data-testid={`link-nav-${card.title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <Card 
                className="hover-elevate active-elevate-2 cursor-pointer h-full transition-all"
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
          <CardTitle>About CourseHub</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            CourseHub is designed for participants who have attended our collaborative webinars. 
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
              <h4 className="font-medium text-sm">Global Mindmaps</h4>
              <p className="text-xs text-muted-foreground">
                View Miro mindmaps created collaboratively during webinars
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
