import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { db, familyGroupsTable, familyDataTable } from '@workspace/db';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

// ── Rate limiters ─────────────────────────────────────────────────────────────

// Strict limiter on code-lookup endpoints — prevents brute-force enumeration
// of the 6-character family code space.
const joinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later.' },
  skipSuccessfulRequests: false,
});

// Moderate limiter on data sync endpoints — enough for normal multi-device use.
const syncLimiter = rateLimit({
  windowMs: 60 * 1000,         // 1 minute
  max: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
});

// Tight limiter on group creation — prevents spam generation of codes.
const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,   // 1 hour
  max: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many groups created, please try again later.' },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// Validates a 6-character family code (same alphabet as makeCode).
const codeParam = z.string().regex(/^[A-Z2-9]{6}$/);

// Max serialised payload size: 128 KB — plenty for any realistic family dataset.
const MAX_PAYLOAD_BYTES = 128 * 1024;

const pushBodySchema = z.object({
  payload: z.record(z.unknown()),
  deviceId: z.string().min(1).max(64),
  deviceName: z.string().min(1).max(64),
});

// ── Routes ────────────────────────────────────────────────────────────────────

router.post('/family/create', createLimiter, async (req, res) => {
  let code = makeCode();
  let attempts = 0;
  while (attempts < 10) {
    const existing = await db
      .select()
      .from(familyGroupsTable)
      .where(eq(familyGroupsTable.code, code));
    if (existing.length === 0) break;
    code = makeCode();
    attempts++;
  }
  await db.insert(familyGroupsTable).values({ code });
  req.log.info({ code }, 'family created');
  res.status(201).json({ code });
});

router.post('/family/join', joinLimiter, async (req, res) => {
  const parseCode = codeParam.safeParse((req.body as { code?: unknown }).code);
  if (!parseCode.success) {
    res.status(400).json({ error: 'Invalid code format' });
    return;
  }
  const code = parseCode.data;
  const groups = await db
    .select()
    .from(familyGroupsTable)
    .where(eq(familyGroupsTable.code, code));
  if (groups.length === 0) {
    res.status(404).json({ error: 'Family not found' });
    return;
  }
  const data = await db
    .select()
    .from(familyDataTable)
    .where(eq(familyDataTable.code, code));
  const payload = data[0]?.payload ?? null;
  req.log.info({ code }, 'family joined');
  res.json({ code, payload });
});

router.get('/family/:code/data', joinLimiter, async (req, res) => {
  const parseCode = codeParam.safeParse(req.params.code);
  if (!parseCode.success) {
    res.status(400).json({ error: 'Invalid code' });
    return;
  }
  const code = parseCode.data;
  const groups = await db
    .select()
    .from(familyGroupsTable)
    .where(eq(familyGroupsTable.code, code));
  if (groups.length === 0) {
    res.status(404).json({ error: 'Family not found' });
    return;
  }
  const data = await db
    .select()
    .from(familyDataTable)
    .where(eq(familyDataTable.code, code));
  res.json({ payload: data[0]?.payload ?? null, updatedAt: data[0]?.updatedAt ?? null });
});

router.put('/family/:code/data', syncLimiter, async (req, res) => {
  const parseCode = codeParam.safeParse(req.params.code);
  if (!parseCode.success) {
    res.status(400).json({ error: 'Invalid code' });
    return;
  }
  const code = parseCode.data;

  const parseBody = pushBodySchema.safeParse(req.body);
  if (!parseBody.success) {
    res.status(400).json({ error: 'Invalid body' });
    return;
  }

  // Enforce payload size limit before touching the DB.
  const serialised = JSON.stringify(parseBody.data.payload);
  if (serialised.length > MAX_PAYLOAD_BYTES) {
    res.status(413).json({ error: 'Payload too large' });
    return;
  }

  const groups = await db
    .select()
    .from(familyGroupsTable)
    .where(eq(familyGroupsTable.code, code));
  if (groups.length === 0) {
    res.status(404).json({ error: 'Family not found' });
    return;
  }

  const now = new Date();
  await db
    .insert(familyDataTable)
    .values({ code, payload: parseBody.data.payload, updatedAt: now })
    .onConflictDoUpdate({
      target: familyDataTable.code,
      set: { payload: parseBody.data.payload, updatedAt: now },
    });
  req.log.info({ code }, 'family data pushed');
  res.json({ updatedAt: now.toISOString() });
});

export default router;
