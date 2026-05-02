import { pgTable, varchar, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod/v4';

export const familyGroupsTable = pgTable('family_groups', {
  code:      varchar('code', { length: 6 }).primaryKey(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const familyDataTable = pgTable('family_data', {
  code:      varchar('code', { length: 6 }).primaryKey().references(() => familyGroupsTable.code),
  payload:   jsonb('payload').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertFamilyGroupSchema = createInsertSchema(familyGroupsTable);
export type InsertFamilyGroup = z.infer<typeof insertFamilyGroupSchema>;
export type FamilyGroup = typeof familyGroupsTable.$inferSelect;
export type FamilyData  = typeof familyDataTable.$inferSelect;
