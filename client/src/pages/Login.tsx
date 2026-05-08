import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Vote, Users, Globe, Sparkles, Loader2, KeyRound, UserPlus, LogIn, RefreshCw, ChevronDown } from "lucide-react";
import loginHeroImage from "@assets/generated_images/Login_hero_collaboration_illustration_547be2cb.png";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, useSearch } from "wouter";
import { hasSavedIdentity, getSavedDid } from "@/lib/did-auth";

type AuthMode = "did" | "password" | "register";

export default function Login() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const [displayName, setDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("password");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [regDisplayName, setRegDisplayName] = useState("");
  const [didOpen, setDidOpen] = useState(false);

  const {
    login,
    loginWithCredentials,
    register,
    loginWithOAuth,
    oauthProviders,
    isLoading: isAuthLoading,
    isAuthenticated,
    error: authError,
  } = useAuth();

  const hasIdentity = hasSavedIdentity();
  const savedDid = getSavedDid();

  // Handle OAuth error from redirect — clear stale cookies
  useEffect(() => {
    const params = new URLSearchParams(search);
    const oauthError = params.get("error");
    if (oauthError) {
      // Clear any stale session cookies from failed OAuth attempts
      document.cookie = 'neos_session=; Max-Age=0; path=/;';
      document.cookie = 'neos_selected_ecosystems=; Max-Age=0; path=/;';
      const messages: Record<string, string> = {
        oauth_denied: "OAuth sign-in was cancelled.",
        oauth_failed: "OAuth sign-in failed. Please try again.",
        unknown_provider: "Unknown OAuth provider.",
        no_ecosystem: "No ecosystem configured on the server.",
      };
      toast({
        title: "Sign In Failed",
        description: messages[oauthError] || "An error occurred during sign-in.",
        variant: "destructive",
      });
    }
  }, [search, toast]);

  // Redirect if already authenticated
  if (isAuthenticated && !isAuthLoading) {
    setLocation('/dashboard');
    return null;
  }

  const handleDIDLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await login(displayName || undefined);
      toast({
        title: "Login Successful",
        description: "Welcome to NEOS!",
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

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setIsSubmitting(true);

    try {
      await loginWithCredentials(username, password);
      toast({
        title: "Login Successful",
        description: "Welcome to NEOS!",
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both password fields match.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await register(username, password, regDisplayName || undefined);
      toast({
        title: "Account Created",
        description: "Welcome to NEOS!",
      });
      setLocation('/dashboard');
    } catch (err) {
      toast({
        title: "Registration Failed",
        description: err instanceof Error ? err.message : "Could not create account",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuth = async (provider: string) => {
    try {
      await loginWithOAuth(provider);
    } catch (err) {
      toast({
        title: "OAuth Failed",
        description: err instanceof Error ? err.message : "Could not start OAuth",
        variant: "destructive",
      });
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
            <h1 className="text-4xl font-bold">Welcome to NEOS</h1>
            <p className="text-xl text-muted-foreground">
              New Earth Operating System
            </p>
          </div>

          <Card>
            <CardHeader className="text-center">
              <CardTitle>
                {authMode === "register"
                  ? 'Create Account'
                  : 'Sign In'}
              </CardTitle>
              <CardDescription>
                {authMode === "register"
                  ? 'Create a new account with username and password'
                  : 'Enter your credentials to access your ecosystem'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* OAuth Buttons - shown first for least friction */}
              {oauthProviders.length > 0 && authMode !== "did" && (
                <div className="space-y-2">
                  {oauthProviders.map((provider) => (
                    <Button
                      key={provider.id}
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleOAuth(provider.id)}
                      disabled={isSubmitting}
                    >
                      {provider.id === "google" && (
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      )}
                      {provider.id === "linkedin" && (
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="#0A66C2">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      )}
                      Continue with {provider.name}
                    </Button>
                  ))}
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">or</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Password Login (default) */}
              {authMode === "password" && (
                <>
                  <form onSubmit={handlePasswordLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={isSubmitting}
                        autoComplete="username"
                        data-testid="input-username"
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
                        disabled={isSubmitting}
                        autoComplete="current-password"
                        data-testid="input-password"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting || !username.trim() || !password.trim()}
                      data-testid="button-password-login"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          <LogIn className="w-4 h-4 mr-2" />
                          Sign In
                        </>
                      )}
                    </Button>
                  </form>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setAuthMode("register")}
                      className="w-full text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                    >
                      Don't have an account? Sign up
                    </button>
                  </div>

                  {/* Advanced: DID login in collapsible */}
                  <Collapsible open={didOpen} onOpenChange={setDidOpen}>
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="w-full flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ChevronDown className={`w-3 h-3 transition-transform ${didOpen ? "rotate-180" : ""}`} />
                        Advanced: Sign in with DID
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-4 space-y-4">
                      <form onSubmit={handleDIDLogin} className="space-y-4">
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
                                  Sign In with DID
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
                                  Create DID & Sign In
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </form>
                      {hasIdentity && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("This will clear your saved identity. You can regenerate a new one after signing in with username/password. Continue?")) {
                              import("@/lib/did-auth").then(({ clearKeyPair }) => {
                                clearKeyPair();
                                window.location.reload();
                              });
                            }
                          }}
                          className="w-full text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center justify-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Reset saved identity
                        </button>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                </>
              )}

              {/* Registration */}
              {authMode === "register" && (
                <>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-display-name">Display Name (optional)</Label>
                      <Input
                        id="reg-display-name"
                        type="text"
                        placeholder="How should we call you?"
                        value={regDisplayName}
                        onChange={(e) => setRegDisplayName(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-username">Username</Label>
                      <Input
                        id="reg-username"
                        type="text"
                        placeholder="Choose a username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={isSubmitting}
                        autoComplete="username"
                      />
                      <p className="text-xs text-muted-foreground">3-50 characters, letters, numbers, and underscores</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Password</Label>
                      <Input
                        id="reg-password"
                        type="password"
                        placeholder="Choose a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isSubmitting}
                        autoComplete="new-password"
                      />
                      <p className="text-xs text-muted-foreground">At least 8 characters</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-confirm">Confirm Password</Label>
                      <Input
                        id="reg-confirm"
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isSubmitting}
                        autoComplete="new-password"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting || !username.trim() || !password.trim() || !confirmPassword.trim()}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Create Account
                        </>
                      )}
                    </Button>
                  </form>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setAuthMode("password")}
                      className="w-full text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                    >
                      Already have an account? Sign in
                    </button>
                  </div>
                </>
              )}

              {/* DID-only mode (kept for backward compat if navigated to directly) */}
              {authMode === "did" && (
                <>
                  <form onSubmit={handleDIDLogin} className="space-y-4">
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
                          <Label htmlFor="displayName-did">Display Name (optional)</Label>
                          <Input
                            id="displayName-did"
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
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setAuthMode("password")}
                      className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Sign in with username & password
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode("register")}
                      className="w-full text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                    >
                      Create a new account
                    </button>
                    {hasIdentity && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("This will clear your saved identity. You can regenerate a new one after signing in with username/password. Continue?")) {
                            import("@/lib/did-auth").then(({ clearKeyPair }) => {
                              clearKeyPair();
                              window.location.reload();
                            });
                          }
                        }}
                        className="w-full text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center justify-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Reset saved identity
                      </button>
                    )}
                  </div>
                </>
              )}

              {authError && (
                <p className="text-sm text-destructive text-center">{authError}</p>
              )}

              <div className="space-y-4 pt-4">
                <h3 className="font-semibold text-center">What You Can Do</h3>
                <div className="grid gap-4">
                  <div className="flex gap-3 items-start">
                    <Vote className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Participate in Governance</p>
                      <p className="text-sm text-muted-foreground">
                        Shape decisions using the Advice-Consent-Test process
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <Users className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Join Your Community</p>
                      <p className="text-sm text-muted-foreground">
                        Connect with your ecosystem and find your role
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <Globe className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Cross-Ecosystem Discovery</p>
                      <p className="text-sm text-muted-foreground">
                        Find collaborations across the NEOS network
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">AI-Powered Guidance</p>
                      <p className="text-sm text-muted-foreground">
                        Get help from governance-aware AI assistants
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
          <h2 className="text-3xl font-bold mb-4">Govern Together, Thrive Together</h2>
          <p className="text-lg opacity-90">
            Consent-based governance for self-organizing communities
          </p>
        </div>
      </div>
    </div>
  );
}
