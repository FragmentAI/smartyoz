// server/productionAuth.ts - Example production authentication
import session from "express-session";
import bcrypt from "bcrypt";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

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
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS in production
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  console.log("🔧 Setting up PRODUCTION authentication");
  
  app.set("trust proxy", 1);
  app.use(getSession());

  // Login endpoint
  app.post("/api/auth/login", async (req: any, res) => {
    const { email, password } = req.body;
    
    try {
      // Get user from database
      const user = await storage.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Create session
      req.session.user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        claims: {
          sub: user.id,
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName,
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
        }
      };

      res.json({ 
        success: true, 
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Register endpoint
  app.post("/api/auth/register", async (req: any, res) => {
    const { email, password, firstName, lastName } = req.body;
    
    try {
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user
      const user = await storage.upsertUser({
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        firstName,
        lastName,
        passwordHash
      });

      res.json({ 
        success: true,
        message: "User created successfully" 
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  // User info endpoint
  app.get("/api/auth/user", isAuthenticated, (req: any, res) => {
    res.json(req.user);
  });
}

export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  // Check if session is expired
  if (req.session.user.claims.exp < Math.floor(Date.now() / 1000)) {
    req.session.destroy(() => {});
    return res.status(401).json({ error: "Session expired" });
  }

  req.user = req.session.user;
  next();
};
