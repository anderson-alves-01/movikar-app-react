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
  connectionTimeoutMillis: 15000, // Increased to 15 seconds
  idleTimeoutMillis: 30000, // 30 seconds
  max: 10, // Maximum number of connections
  min: 1, // Minimum number of connections
};

export const pool = new Pool(connectionConfig);
export const db = drizzle({ client: pool, schema });

// Enhanced database connection validation with retries
export async function validateDatabaseConnection(maxRetries = 3, retryDelay = 2000): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Database connection attempt ${attempt}/${maxRetries}`);
      
      // Test connection with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database connection timeout')), 8000);
      });
      
      const connectionTest = pool.query('SELECT 1 as test');
      await Promise.race([connectionTest, timeoutPromise]);
      
      console.log(`✅ Database connection successful on attempt ${attempt}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Database connection attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        console.error('🚨 All database connection attempts failed');
        return false;
      }
      
      if (retryDelay > 0) {
        console.log(`⏳ Waiting ${retryDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  return false;
}

// Enhanced health check that works without database
export async function getDatabaseStatus(): Promise<{ connected: boolean; error?: string; latency?: number }> {
  try {
    const start = Date.now();
    await pool.query('SELECT 1');
    const latency = Date.now() - start;
    return { connected: true, latency };
  } catch (error) {
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

// Add graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, closing database connections...');
  await pool.end();
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, closing database connections...');
  await pool.end();
});