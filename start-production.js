#!/usr/bin/env node

// Production startup script with comprehensive error handling for deployment health checks
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Start the production server with error handling
const startServer = () => {
  console.log('Starting CarShare production server...');
  
  const serverPath = join(__dirname, 'dist', 'index.js');
  const serverProcess = spawn('node', [serverPath], {
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: process.env.PORT || '5000'
    },
    stdio: ['inherit', 'pipe', 'pipe']
  });

  let serverOutput = '';
  let errorOutput = '';

  serverProcess.stdout.on('data', (data) => {
    const output = data.toString();
    serverOutput += output;
    console.log(output.trim());
    
    // Check if server is ready
    if (output.includes('serving on port')) {
      console.log('✅ CarShare server is ready for deployment');
    }
  });

  serverProcess.stderr.on('data', (data) => {
    const error = data.toString();
    errorOutput += error;
    console.error(error.trim());
  });

  serverProcess.on('error', (error) => {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  });

  serverProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ Server exited with code ${code}`);
      console.error('Error output:', errorOutput);
      process.exit(code);
    }
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🔄 Gracefully shutting down server...');
    serverProcess.kill('SIGTERM');
  });

  process.on('SIGTERM', () => {
    console.log('\n🔄 Gracefully shutting down server...');
    serverProcess.kill('SIGTERM');
  });
};

startServer();