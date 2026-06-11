import { Request, Response, NextFunction } from "express";
import { db } from "./db.js";
import { agents, clients, magicTokens } from "@shared/schema";
import { eq, and, gt } from "drizzle-orm";
import crypto from "crypto";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export async function sendMagicLink(
  email: string,
  userType: "agent" | "client",
  userId: number
) {
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 min
  const [token] = await db
    .insert(magicTokens)
    .values({ email, userType, userId, expiresAt })
    .returning();

  const url = `${process.env.APP_URL}/auth/verify?token=${token.token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Your CMA Tracker login link",
    html: `
      <div style="font-family:Inter,sans-serif;background:#0d1117;color:#e6edf3;padding:32px;max-width:480px;margin:0 auto;border-radius:12px;">
        <h2 style="color:#fff;margin-bottom:8px;">Sign in to CMA Tracker</h2>
        <p style="color:#8b949e;margin-bottom:24px;">Click the button below to sign in. This link expires in 30 minutes.</p>
        <a href="${url}" style="display:inline-block;background:#388bfd;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Sign In</a>
        <p style="color:#484f58;font-size:12px;margin-top:24px;">If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  });
}

export async function verifyMagicToken(token: string) {
  const [row] = await db
    .select()
    .from(magicTokens)
    .where(
      and(
        eq(magicTokens.token, token as any),
        gt(magicTokens.expiresAt, new Date()),
        eq(magicTokens.usedAt, null as any)
      )
    )
    .limit(1);

  if (!row) return null;

  await db
    .update(magicTokens)
    .set({ usedAt: new Date() })
    .where(eq(magicTokens.id, row.id));

  return row;
}

export function requireAgent(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.agentId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

export function requireClient(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.clientId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.agentId && !req.session?.clientId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}
