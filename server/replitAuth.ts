import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true, // Auto-create sessions table if missing
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only secure in production
      sameSite: 'lax', // CSRF protection
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUserFromClaims(claims: any) {
  // Handle both Replit-specific and standard OIDC claim names
  const firstName = claims["first_name"] || claims["given_name"] || null;
  const lastName = claims["last_name"] || claims["family_name"] || null;
  const profileImageUrl = claims["profile_image_url"] || claims["picture"] || null;
  
  // Derive username from email (part before @) or use sub as fallback
  const username = claims["email"] 
    ? claims["email"].split("@")[0] 
    : claims["sub"];
  
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName,
    lastName,
    profileImageUrl,
    username,
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUserFromClaims(tokens.claims());
    verified(null, user);
  };

  for (const domain of process.env.REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Local authentication strategy for testing (development only)
  passport.use(new LocalStrategy(
    { usernameField: 'username', passwordField: 'password' },
    async (username, password, done) => {
      try {
        console.log('[Auth] Local login attempt for username:', username);
        
        // Simple test users for development
        const testUsers: Record<string, { id: string; password: string; email: string; firstName: string; lastName: string; role: "admin" | "facilitator" | "contributor" | "viewer" }> = {
          'admin': { id: 'test-admin-id', password: 'admin123', email: 'admin@test.com', firstName: 'Admin', lastName: 'User', role: 'admin' },
          'facilitator': { id: 'test-facilitator-id', password: 'facilitator123', email: 'facilitator@test.com', firstName: 'Facilitator', lastName: 'User', role: 'facilitator' },
          'contributor': { id: 'test-contributor-id', password: 'contributor123', email: 'contributor@test.com', firstName: 'Contributor', lastName: 'User', role: 'contributor' },
          'viewer': { id: 'test-viewer-id', password: 'viewer123', email: 'viewer@test.com', firstName: 'Viewer', lastName: 'User', role: 'viewer' },
        };

        const testUser = testUsers[username];
        if (!testUser || testUser.password !== password) {
          console.log('[Auth] Invalid credentials for username:', username);
          return done(null, false, { message: 'Invalid credentials' });
        }

        console.log('[Auth] Credentials valid, upserting user:', testUser.id);
        
        // Upsert test user into database
        await storage.upsertUser({
          id: testUser.id,
          email: testUser.email,
          firstName: testUser.firstName,
          lastName: testUser.lastName,
          profileImageUrl: null,
          username: username, // Add username for local auth
          role: testUser.role,
        });

        console.log('[Auth] User upserted successfully');

        // Create a session object similar to OIDC
        const user = {
          claims: {
            sub: testUser.id,
            email: testUser.email,
            first_name: testUser.firstName,
            last_name: testUser.lastName,
            exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
          },
          access_token: 'test-token',
          expires_at: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60),
        };

        console.log('[Auth] Local login successful for:', testUser.email);
        return done(null, user);
      } catch (error) {
        console.error('[Auth] Local login error:', error);
        return done(error);
      }
    }
  ));

  app.get("/api/login", (req, res, next) => {
    // Get first configured domain if hostname not in list
    const domains = process.env.REPLIT_DOMAINS!.split(",");
    const domain = domains.includes(req.hostname) ? req.hostname : domains[0];
    const strategyName = `replitauth:${domain}`;
    
    console.log(`[Auth] Login request for hostname: ${req.hostname}, using strategy: ${strategyName}`);
    
    passport.authenticate(strategyName, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    // Get first configured domain if hostname not in list
    const domains = process.env.REPLIT_DOMAINS!.split(",");
    const domain = domains.includes(req.hostname) ? req.hostname : domains[0];
    const strategyName = `replitauth:${domain}`;
    
    console.log(`[Auth] Callback for hostname: ${req.hostname}, using strategy: ${strategyName}`);
    
    passport.authenticate(strategyName, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  // Local login route (for testing)
  app.post("/api/login/local", (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: 'Authentication error' });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || 'Invalid credentials' });
      }
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ message: 'Login failed' });
        }
        return res.json({ success: true, user: { email: user.claims.email, name: `${user.claims.first_name} ${user.claims.last_name}` } });
      });
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    const isLocalAuth = !req.user || !(req.user as any).refresh_token;
    
    req.logout((err) => {
      if (err) {
        console.error("[Auth] Logout error:", err);
        return res.status(500).send("Logout failed");
      }
      
      // Destroy session and clear cookie
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          console.error("[Auth] Session destroy error:", destroyErr);
        }
        
        res.clearCookie("connect.sid");
        
        // For local auth, just redirect to home
        if (isLocalAuth) {
          return res.redirect('/');
        }
        
        // For OIDC, redirect to end session
        res.redirect(
          client.buildEndSessionUrl(config, {
            client_id: process.env.REPL_ID!,
            post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
          }).href
        );
      });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    
    // Persist refreshed tokens to session store
    req.session.save((err) => {
      if (err) {
        console.error("[Auth] Session save error after token refresh:", err);
        return res.status(500).json({ message: "Session save failed" });
      }
      return next();
    });
  } catch (error) {
    console.error("[Auth] Token refresh error:", error);
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
