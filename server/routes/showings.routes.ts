import { Router } from "express";
import { db } from "../db.js";
import { showings, showingFeedback } from "@shared/schema";
import { eq } from "drizzle-orm";
import { requireAgent } from "../auth.js";
import { z } from "zod";

const router = Router();

router.use(requireAgent);

// GET /api/showings?propertyId=xxx
router.get("/", async (req, res) => {
  const propertyId = Number(req.query.propertyId);
  const rows = await db
    .select()
    .from(showings)
    .where(eq(showings.propertyId, propertyId));
  res.json(rows);
});

// POST /api/showings
router.post("/", async (req, res) => {
  const body = z.object({
    propertyId: z.number(),
    showingDate: z.string().datetime(),
    agentName: z.string().optional(),
    agentBrokerage: z.string().optional(),
    agentPhone: z.string().optional(),
    agentEmail: z.string().optional(),
    duration: z.number().optional(),
  }).parse(req.body);

  const [showing] = await db
    .insert(showings)
    .values({ ...body, showingDate: new Date(body.showingDate) })
    .returning();
  res.status(201).json(showing);
});

// POST /api/showings/:id/feedback
router.post("/:id/feedback", async (req, res) => {
  const showingId = Number(req.params.id);
  const body = z.object({
    rating: z.number().min(1).max(5).optional(),
    priceOpinion: z.enum(["too_high", "fair", "good_value"]).optional(),
    likedFeatures: z.string().optional(),
    concerns: z.string().optional(),
    likelyToOffer: z.boolean().optional(),
    rawText: z.string().optional(),
  }).parse(req.body);

  const [feedback] = await db
    .insert(showingFeedback)
    .values({ ...body, showingId, enteredBy: "leon" })
    .returning();
  res.status(201).json(feedback);
});

export default router;
