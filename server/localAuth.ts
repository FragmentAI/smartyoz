import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// Mock user for local development
const MOCK_USER = {
  id: "local-dev-user-123",
  email: "admin@smartyoz.local",
  firstName: "Admin",
  lastName: "User",
  profileImageUrl: "https://via.placeholder.com/150",
  claims: {
    sub: "local-dev-user-123",
    email: "admin@smartyoz.local",
    first_name: "Admin",
    last_name: "User",
    profile_image_url: "https://via.placeholder.com/150",
    exp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // Expires in 1 year
  },
  access_token: "mock-access-token",
  refresh_token: "mock-refresh-token",
  expires_at: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // Expires in 1 year
};

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || "local-dev-secret-key-change-in-production",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to false for local development (HTTP)
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  console.log("🔧 Setting up LOCAL DEVELOPMENT authentication bypass");
  console.log("⚠️  WARNING: This should NEVER be used in production!");
  
  app.set("trust proxy", 1);
  app.use(getSession());

  // Initialize the mock user in the database
  await initializeMockUser();

  // Mock authentication middleware
  app.use((req: any, res, next) => {
    // Mock passport methods
    req.isAuthenticated = () => true;
    req.user = MOCK_USER;
    req.login = (user: any, cb: any) => cb(null);
    req.logout = (cb: any) => cb();
    next();
  });

  // Local auth routes
  app.get("/api/login", (req, res) => {
    console.log("📝 Local auth: Mock login");
    res.redirect("/");
  });

  app.get("/api/callback", (req, res) => {
    console.log("📝 Local auth: Mock callback");
    res.redirect("/");
  });

  app.get("/api/logout", (req, res) => {
    console.log("📝 Local auth: Mock logout");
    res.redirect("/");
  });
}

async function initializeMockUser() {
  try {
    // Create the mock user
    await storage.upsertUser({
      id: MOCK_USER.id,
      email: MOCK_USER.email,
      firstName: MOCK_USER.firstName,
      lastName: MOCK_USER.lastName,
      profileImageUrl: MOCK_USER.profileImageUrl,
    });
    console.log("✅ Mock user initialized in database");

    // Check if user already has a role, if not create super admin role
    const existingRole = await storage.getUserRole(MOCK_USER.id);
    if (!existingRole) {
      await storage.createUserRole({
        userId: MOCK_USER.id,
        role: "super_admin",
        permissions: [
          "admin:read",
          "admin:write", 
          "organization:read",
          "organization:write",
          "interviews",
          "candidates:read",
          "candidates:write",
          "jobs:read",
          "jobs:write",
          "reports:read",
          "settings:read",
          "settings:write"
        ]
      });
      console.log("✅ Mock user admin role created");
    } else {
      console.log("✅ Mock user role already exists");
    }
  } catch (error) {
    console.error("❌ Failed to initialize mock user:", error);
  }
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  console.log('🔒 Local auth check:', {
    isAuthenticated: req.isAuthenticated(),
    hasUser: !!user,
    userEmail: user?.email,
    url: req.url,
    method: req.method
  });

  // In local development, always allow access
  if (process.env.NODE_ENV === "development") {
    return next();
  }

  // For production, you would implement real authentication here
  if (!req.isAuthenticated() || !user) {
    console.log('❌ Authentication failed');
    return res.status(401).json({ message: "Unauthorized" });
  }

  next();
};
