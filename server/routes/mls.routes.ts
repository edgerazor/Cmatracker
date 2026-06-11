import { Router } from "express";
import { requireAgent } from "../auth.js";

const router = Router();
const MLS_API = process.env.MLS_API_URL!;
const MLS_KEY = process.env.MLS_API_KEY;

const mlsHeaders: Record<string, string> = MLS_KEY
  ? { Authorization: `Bearer ${MLS_KEY}` }
  : {};

// Proxy to BridgeSyncEngine — search properties for comp selection
// GET /api/mls/properties?status=Closed&city=Nanaimo&minPrice=...&maxPrice=...&subArea=...
router.get("/properties", requireAgent, async (req, res) => {
  const params = new URLSearchParams(req.query as Record<string, string>);
  const response = await fetch(`${MLS_API}/api/v1/properties?${params}`, {
    headers: mlsHeaders,
  });
  const data = await response.json();
  res.json(data);
});

export default router;
