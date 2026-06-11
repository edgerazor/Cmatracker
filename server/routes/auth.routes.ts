import { Router } from "express";
import { db } from "../db.js";
import { agents, clients } from "@shared/schema";
import { eq } from "drizzle-orm";
import { sendMagicLink, verifyMagicToken } from "../auth.js";
import { z } from "zod";

const router = Router();

// POST /api/auth/magic — request a magic link
router.post("/magic", async (req, res) => {
  const { email } = z.object({ email: z.string().email() }).parse(req.body);

  // Check agents first, then clients
  const [agent] = await db.select().from(agents).where(eq(agents.email, email)).limit(1);
  if (agent) {
    await sendMagicLink(email, "agent", agent.id);
    return res.json({ sent: true });
  }

  const [client] = await db.select().from(clients).where(eq(clients.email, email)).limit(1);
  if (client) {
    await sendMagicLink(email, "client", client.id);
    return res.json({ sent: true });
  }

  // Don't reveal whether email exists
  return res.json({ sent: true });
});

// GET /api/auth/verify?token=xxx
router.get("/verify", async (req, res) => {
  const { token } = z.object({ token: z.string().uuid() }).parse(req.query);
  const row = await verifyMagicToken(token);

  if (!row) {
    return res.redirect(`${process.env.APP_URL}/login?error=invalid_token`);
  }

  if (row.userType === "agent") {
    req.session.agentId = row.userId;
  } else {
    req.session.clientId = row.userId;
  }

  return res.redirect(`${process.env.APP_URL}/dashboard`);
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// GET /api/auth/me
router.get("/me", async (req, res) => {
  if (req.session?.agentId) {
    const [agent] = await db
      .select()
      .from(agents)
      .where(eq(agents.id, req.session.agentId))
      .limit(1);
    return res.json({ type: "agent", user: { ...agent, passwordHash: undefined } });
  }
  if (req.session?.clientId) {
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, req.session.clientId))
      .limit(1);
    return res.json({ type: "client", user: client });
  }
  return res.status(401).json({ error: "Not authenticated" });
});

export default router;
