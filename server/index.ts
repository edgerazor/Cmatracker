import "dotenv/config";
import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.routes.js";
import clientRoutes from "./routes/clients.routes.js";
import propertyRoutes from "./routes/properties.routes.js";
import mlsRoutes from "./routes/mls.routes.js";
import showingRoutes from "./routes/showings.routes.js";
import portalRoutes from "./routes/portal.routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
// API_PORT, not PORT — dev tooling injects PORT for the Vite front-end
const PORT = Number(process.env.API_PORT) || 3001;

// Session store
const PgSession = connectPgSimple(session);
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

app.use(express.json());
app.use(
  session({
    store: new PgSession({ pool, createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    },
  })
);

// Extend session type
declare module "express-session" {
  interface SessionData {
    agentId?: number;
    clientId?: number;
  }
}

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/mls", mlsRoutes);
app.use("/api/showings", showingRoutes);
app.use("/api/portal", portalRoutes);

// Serve React in production
if (process.env.NODE_ENV === "production") {
  const staticPath = path.join(__dirname, "public");
  app.use(express.static(staticPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`CMA Tracker server running on port ${PORT}`);
});
