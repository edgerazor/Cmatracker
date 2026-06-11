import { Router } from "express";
import { db } from "../db.js";
import { properties, probabilityConfig } from "@shared/schema";
import { eq } from "drizzle-orm";
import { requireAgent } from "../auth.js";
import { z } from "zod";

const router = Router();

router.use(requireAgent);

// GET /api/properties — all properties for this agent
router.get("/", async (req, res) => {
  const agentId = req.session.agentId!;
  const rows = await db
    .select()
    .from(properties)
    .where(eq(properties.agentId, agentId));
  res.json(rows);
});

// POST /api/properties
router.post("/", async (req, res) => {
  const agentId = req.session.agentId!;
  const body = z.object({
    clientId: z.number(),
    address: z.string().min(1),
    city: z.string().optional(),
    province: z.string().optional(),
    postalCode: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    subArea: z.string().optional(),
    propertyType: z.string().optional(),
    yearBuilt: z.number().optional(),
    bedrooms: z.number().optional(),
    bathroomsFull: z.number().optional(),
    bathroomsHalf: z.number().optional(),
    sqft: z.number().optional(),
    lotSizeAcres: z.number().optional(),
    stories: z.number().optional(),
    layout: z.string().optional(),
    description: z.string().optional(),
    photoUrl: z.string().optional(),
  }).parse(req.body);

  const [property] = await db
    .insert(properties)
    .values({ ...body, agentId })
    .returning();

  // Create default probability config
  await db.insert(probabilityConfig).values({ propertyId: property.id });

  res.status(201).json(property);
});

// GET /api/properties/:id
router.get("/:id", async (req, res) => {
  const [property] = await db
    .select()
    .from(properties)
    .where(eq(properties.id, Number(req.params.id)))
    .limit(1);
  if (!property) return res.status(404).json({ error: "Not found" });
  res.json(property);
});

// PATCH /api/properties/:id
router.patch("/:id", async (req, res) => {
  const [property] = await db
    .update(properties)
    .set({ ...req.body, updatedAt: new Date() })
    .where(eq(properties.id, Number(req.params.id)))
    .returning();
  res.json(property);
});

export default router;
