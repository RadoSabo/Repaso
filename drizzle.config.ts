import type { Config } from 'drizzle-kit';

// Present for future schema migrations. The MVP bootstraps the schema at
// runtime (see src/db/client.ts), so generating migrations is optional:
//   npx drizzle-kit generate
export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'expo',
} satisfies Config;
