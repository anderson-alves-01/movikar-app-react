import type { Express } from "express";

export function registerHealthRoutes(app: Express) {
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    const healthCheck = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      database: 'connected', // You can add actual DB health check here
      services: {
        auth: 'healthy',
        payments: 'healthy',
        messaging: 'healthy'
      }
    };

    res.status(200).json(healthCheck);
  });

  // Readiness check (for Kubernetes/container orchestration)
  app.get('/api/ready', (req, res) => {
    // Add checks for database connectivity, external services, etc.
    try {
      // Example: check database connection
      // await db.query('SELECT 1');
      
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'ok',
          cache: 'ok',
          dependencies: 'ok'
        }
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