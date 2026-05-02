import { Router } from 'express';
import { db, familyGroupsTable, familyDataTable } from '@workspace/db';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

function makeCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const codeParam = z.string().regex(/^[A-Z2-9]{6}$/);

router.post('/family/create', async (req, res) => {
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
  res.json({ code });
});

router.post('/family/join', async (req, res) => {
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

router.get('/family/:code/data', async (req, res) => {
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

const pushBodySchema = z.object({
  payload: z.unknown(),
  deviceId: z.string().max(64),
  deviceName: z.string().max(64),
});

router.put('/family/:code/data', async (req, res) => {
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
  const { payload } = parseBody.data;
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
    .values({ code, payload: payload as Record<string, unknown>, updatedAt: now })
    .onConflictDoUpdate({
      target: familyDataTable.code,
      set: { payload: payload as Record<string, unknown>, updatedAt: now },
    });
  req.log.info({ code }, 'family data pushed');
  res.json({ updatedAt: now.toISOString() });
});

export default router;
