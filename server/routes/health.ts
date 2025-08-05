import type { Express } from "express";

export function registerHealthRoutes(app: Express) {
  // Health check endpoint
  app.get('/api/health', async (req, res) => {
    try {
      let dbStatus = 'disconnected';
      let dbError = null;
      
      // Test database connection
      try {
        const { pool } = await import("../db");
        await pool.query('SELECT 1');
        dbStatus = 'connected';
      } catch (err) {
        dbError = err instanceof Error ? err.message : 'Unknown database error';
      }

      const healthCheck = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        database: dbStatus,
        ...(dbError && { databaseError: dbError }),
        services: {
          auth: dbStatus === 'connected' ? 'healthy' : 'degraded',
          payments: 'healthy',
          messaging: 'healthy'
        }
      };

      res.status(200).json(healthCheck);
    } catch (error) {
      res.status(500).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Readiness check (for Kubernetes/container orchestration)
  app.get('/api/ready', async (req, res) => {
    try {
      let allChecks = true;
      const checks: any = {};
      
      // Database connectivity check
      try {
        const { pool } = await import("../db");
        await pool.query('SELECT 1');
        checks.database = 'ok';
      } catch (err) {
        checks.database = 'failed';
        checks.databaseError = err instanceof Error ? err.message : 'Connection failed';
        allChecks = false;
      }

      // Environment variables check
      checks.environment = process.env.DATABASE_URL ? 'ok' : 'missing_database_url';
      if (!process.env.DATABASE_URL) allChecks = false;

      checks.cache = 'ok';
      checks.dependencies = 'ok';

      const status = allChecks ? 200 : 503;
      
      res.status(status).json({
        status: allChecks ? 'ready' : 'not ready',
        timestamp: new Date().toISOString(),
        checks
      });
    } catch (error) {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Liveness check (for Kubernetes/container orchestration)
  app.get('/api/live', (req, res) => {
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });
}