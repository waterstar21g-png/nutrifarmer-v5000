import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: ['./lib/v5000-auth/schema.ts', './lib/v5000-content/schema.ts'],
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL ?? process.env.DATABASE_URL ?? '',
  },
});
