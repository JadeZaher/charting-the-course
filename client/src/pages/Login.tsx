import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Users, BarChart3, MapPin, Loader2 } from "lucide-react";
import loginHeroImage from "@assets/generated_images/Login_hero_collaboration_illustration_547be2cb.png";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useLocation, useSearch } from "wouter";

export default function Login() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const { 
    signIn, 
    isSigningIn, 
    signInError, 
    isAuthenticated,
    isLoading: isAuthLoading 
  } = useSupabaseAuth();

  // Get redirect URL from query params
  const getRedirectUrl = () => {
    const params = new URLSearchParams(searchString);
    return params.get('redirect') || '/';
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLocation(getRedirectUrl());
    }
  }, [isAuthenticated, setLocation]);

  const handleSupabaseLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing Fields",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    signIn(
      { email, password },
      {
        onSuccess: () => {
          toast({
            title: "Login Successful",
            description: "Welcome to Charting the Course!",
          });
          setLocation(getRedirectUrl());
        },
        onError: (error) => {
          toast({
            title: "Login Failed",
            description: error.message || "Invalid credentials",
            variant: "destructive",
          });
        },
      }
    );
  };

  // Quick login with test accounts
  const handleQuickLogin = (role: 'admin' | 'facilitator' | 'viewer') => {
    const testEmails = {
      admin: 'admin@chartingthecourse.test',
      facilitator: 'facilitator@chartingthecourse.test',
      viewer: 'viewer@chartingthecourse.test',
    };
    setEmail(testEmails[role]);
    setPassword('TestPassword123!');
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Welcome Content */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-lg space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold">Welcome to Charting the Course</h1>
            <p className="text-xl text-muted-foreground">
              Interactive Learning & Team Management Platform
            </p>
          </div>

          <Card>
            <CardHeader className="text-center">
              <CardTitle>Sign In</CardTitle>
              <CardDescription>
                Sign in to access quizzes, track your progress, and collaborate with your team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Login Form */}
              <form onSubmit={handleSupabaseLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSigningIn}
                    data-testid="input-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSigningIn}
                    data-testid="input-password"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSigningIn}
                  data-testid="button-login"
                >
                  {isSigningIn ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Quick Login (Test)</span>
                </div>
              </div>

              {/* Quick Login Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleQuickLogin('admin')}
                  disabled={isSigningIn}
                >
                  Admin
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleQuickLogin('facilitator')}
                  disabled={isSigningIn}
                >
                  Facilitator
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleQuickLogin('viewer')}
                  disabled={isSigningIn}
                >
                  Viewer
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Click a role above to fill in test credentials, then click Sign In
              </p>

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
