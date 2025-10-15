import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';

export const fileGenerationJobs = pgTable('file_generation_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  userEmail: text('user_email').notNull(),
  url: text('url').notNull(),
  brand: text('brand'),
  category: text('category'),
  competitors: jsonb('competitors'),
  prompts: text('prompts'),
  status: text('status').notNull().default('pending'), // pending | in_progress | completed | failed
  nonce: text('nonce').notNull(),
  result: jsonb('result'),
  error: text('error'),
  webhookAttemptedAt: timestamp('webhook_attempted_at'),
  webhookResponseCode: text('webhook_response_code'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

export type FileGenerationJob = typeof fileGenerationJobs.$inferSelect;
export type NewFileGenerationJob = typeof fileGenerationJobs.$inferInsert;
