import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure connection with retries and timeout for deployment stability
const connectionConfig = {
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000, // 10 seconds
  idleTimeoutMillis: 30000, // 30 seconds
  max: 10, // Maximum number of connections
  min: 1, // Minimum number of connections
};

export const pool = new Pool(connectionConfig);
export const db = drizzle({ client: pool, schema });

// Add graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, closing database connections...');
  await pool.end();
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, closing database connections...');
  await pool.end();
});