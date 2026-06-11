import { Router } from "express";
import { db } from "../db.js";
import { clients, properties } from "@shared/schema";
import { eq } from "drizzle-orm";
import { requireAgent } from "../auth.js";
import { z } from "zod";

const router = Router();

router.use(requireAgent);

// GET /api/clients
router.get("/", async (req, res) => {
  const agentId = req.session.agentId!;
  const rows = await db
    .select()
    .from(clients)
    .where(eq(clients.agentId, agentId));
  res.json(rows);
});

// POST /api/clients
router.post("/", async (req, res) => {
  const agentId = req.session.agentId!;
  const body = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    notes: z.string().optional(),
  }).parse(req.body);

  const [client] = await db
    .insert(clients)
    .values({ ...body, agentId })
    .returning();
  res.status(201).json(client);
});

// GET /api/clients/:id
router.get("/:id", async (req, res) => {
  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, Number(req.params.id)))
    .limit(1);
  if (!client) return res.status(404).json({ error: "Not found" });
  res.json(client);
});

export default router;
