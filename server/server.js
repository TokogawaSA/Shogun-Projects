/**
 * cPanel Phusion Passenger Application Entry Point
 * 
 * cPanel "Setup Node.js App" executes this root file to bootstrap the Express REST API.
 * Phusion Passenger dynamically injects process.env.PORT or passenger socket path.
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment configuration from .env if present
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('🚀 [cPanel Phusion Passenger] Initializing Shogun Express API...');
console.log(`📡 [cPanel Environment] Node Version: ${process.version}, NODE_ENV: ${process.env.NODE_ENV || 'production'}`);
console.log(`🔌 [cPanel Port/Socket] Assigned PORT: ${process.env.PORT || '5000'}`);

// Import the compiled Express application from dist
import app from './dist/app.js';
import { disconnectDatabase } from './dist/config/db.js';

const PORT = process.env.PORT || 5000;

// Bind HTTP server listener dynamically
const server = app.listen(PORT, () => {
  console.log(`✅ [Shogun Server] Multi-Tenant Express REST API active on port/socket: ${PORT}`);
});

// Graceful shutdown handling
const handleShutdown = async (signal) => {
  console.log(`\n🛑 [Shogun Server] Received ${signal}. Gracefully closing connections...`);
  server.close(async () => {
    try {
      await disconnectDatabase();
    } catch (e) {
      // Ignore disconnect error on exit
    }
    console.log('🏁 [Shogun Server] Database pool disconnected. Process finished.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export default app;
