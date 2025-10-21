import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, BarChart3, MapPin } from "lucide-react";
import loginHeroImage from "@assets/generated_images/Login_hero_collaboration_illustration_547be2cb.png";

export default function Login() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Welcome Content */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-lg space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold">Welcome to CourseHub</h1>
            <p className="text-xl text-muted-foreground">
              Interactive Learning & Team Management Platform
            </p>
          </div>

          <Card>
            <CardHeader className="text-center">
              <CardTitle>Get Started</CardTitle>
              <CardDescription>
                Sign in to access quizzes, track your progress, and collaborate with your team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Button 
                onClick={handleLogin} 
                className="w-full" 
                size="lg"
                data-testid="button-login"
              >
                Sign In
              </Button>

              <div className="space-y-4 pt-4">
                <h3 className="font-semibold text-center">What You Can Do</h3>
                <div className="grid gap-4">
                  <div className="flex gap-3 items-start">
                    <BookOpen className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Take Interactive Quizzes</p>
                      <p className="text-sm text-muted-foreground">
                        Assess your collaboration styles and preferences
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <BarChart3 className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Track Your Progress</p>
                      <p className="text-sm text-muted-foreground">
                        View completed quizzes and learning history
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <MapPin className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Explore Team Networks</p>
                      <p className="text-sm text-muted-foreground">
                        View collaborative mindmaps from webinar sessions
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <Users className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Collaborate with Teams</p>
                      <p className="text-sm text-muted-foreground">
                        Join courses and work together on learning goals
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Side - Hero Image */}
      <div 
        className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${loginHeroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="text-center text-white z-10 p-8">
          <h2 className="text-3xl font-bold mb-4">Learn Together, Grow Together</h2>
          <p className="text-lg opacity-90">
            Collaborative learning platform for teams and individuals
          </p>
        </div>
      </div>
    </div>
  );
}
