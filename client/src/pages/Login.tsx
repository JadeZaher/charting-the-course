import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Users, BarChart3, MapPin, Loader2, KeyRound, UserPlus } from "lucide-react";
import loginHeroImage from "@assets/generated_images/Login_hero_collaboration_illustration_547be2cb.png";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { hasSavedIdentity, getSavedDid } from "@/lib/did-auth";

export default function Login() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [displayName, setDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isLoading: isAuthLoading, isAuthenticated, error: authError } = useAuth();

  const hasIdentity = hasSavedIdentity();
  const savedDid = getSavedDid();

  // Redirect if already authenticated
  if (isAuthenticated && !isAuthLoading) {
    setLocation('/dashboard');
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await login(displayName || undefined);
      toast({
        title: "Login Successful",
        description: "Welcome to Charting the Course!",
      });
      setLocation('/dashboard');
    } catch (err) {
      toast({
        title: "Authentication Failed",
        description: err instanceof Error ? err.message : "Could not authenticate",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
              <CardTitle>
                {hasIdentity ? 'Welcome Back' : 'Create Your Identity'}
              </CardTitle>
              <CardDescription>
                {hasIdentity
                  ? 'Sign in with your existing decentralized identity'
                  : 'Generate a self-sovereign identity to get started'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleLogin} className="space-y-4">
                {hasIdentity && savedDid ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-md bg-muted">
                      <Label className="text-xs text-muted-foreground">Your DID</Label>
                      <p className="text-sm font-mono break-all mt-1">{savedDid}</p>
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting}
                      data-testid="button-login"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4 mr-2" />
                          Sign In
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name (optional)</Label>
                      <Input
                        id="displayName"
                        type="text"
                        placeholder="How should we call you?"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        disabled={isSubmitting}
                        data-testid="input-display-name"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting}
                      data-testid="button-login"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating identity...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Create & Sign In
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </form>

              {authError && (
                <p className="text-sm text-destructive text-center">{authError}</p>
              )}

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
