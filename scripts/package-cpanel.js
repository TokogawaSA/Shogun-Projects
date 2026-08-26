import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🚀 [cPanel Packager] Starting Full-Stack Packaging...');

// 1. Ensure dist directories exist
const clientDist = path.join(rootDir, 'dist');
const serverDist = path.join(rootDir, 'server', 'dist');

if (!fs.existsSync(clientDist)) {
  console.log('📦 Client dist not found. Running npm run build...');
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
}

if (!fs.existsSync(serverDist)) {
  console.log('📦 Server dist not found. Running npm run build in server/ ...');
  execSync('npm run build', { cwd: path.join(rootDir, 'server'), stdio: 'inherit' });
}

// Ensure .htaccess exists in client dist
const htaccessPath = path.join(clientDist, '.htaccess');
if (!fs.existsSync(htaccessPath)) {
  const publicHtaccess = path.join(rootDir, 'public', '.htaccess');
  if (fs.existsSync(publicHtaccess)) {
    fs.copyFileSync(publicHtaccess, htaccessPath);
    console.log('✅ Copied .htaccess to dist/');
  }
}

// 2. Prepare Backend Staging Directory
const backendStaging = path.join(rootDir, 'temp_backend_cpanel');
if (fs.existsSync(backendStaging)) {
  fs.rmSync(backendStaging, { recursive: true, force: true });
}
fs.mkdirSync(backendStaging, { recursive: true });

// Copy server/dist -> staging/dist
fs.cpSync(serverDist, path.join(backendStaging, 'dist'), { recursive: true });

// Copy server/package.json -> staging/package.json
const serverPkg = path.join(rootDir, 'server', 'package.json');
if (fs.existsSync(serverPkg)) {
  fs.copyFileSync(serverPkg, path.join(backendStaging, 'package.json'));
}

// Copy server/package-lock.json if exists
const serverPkgLock = path.join(rootDir, 'server', 'package-lock.json');
if (fs.existsSync(serverPkgLock)) {
  fs.copyFileSync(serverPkgLock, path.join(backendStaging, 'package-lock.json'));
}

// Copy server/server.js (Phusion Passenger entry)
const serverJs = path.join(rootDir, 'server', 'server.js');
if (fs.existsSync(serverJs)) {
  fs.copyFileSync(serverJs, path.join(backendStaging, 'server.js'));
}

// Copy server/.env.example -> staging/.env.example
const serverEnv = path.join(rootDir, 'server', '.env.example');
if (fs.existsSync(serverEnv)) {
  fs.copyFileSync(serverEnv, path.join(backendStaging, '.env.example'));
}

// Copy server/prisma -> staging/prisma
const serverPrisma = path.join(rootDir, 'server', 'prisma');
if (fs.existsSync(serverPrisma)) {
  fs.cpSync(serverPrisma, path.join(backendStaging, 'prisma'), { recursive: true });
}

// 3. Zip Archives
const frontendZip = path.join(rootDir, 'frontend_cpanel.zip');
const backendZip = path.join(rootDir, 'backend_cpanel.zip');

if (fs.existsSync(frontendZip)) fs.unlinkSync(frontendZip);
if (fs.existsSync(backendZip)) fs.unlinkSync(backendZip);

const isWindows = process.platform === 'win32';

try {
  if (isWindows) {
    // Compress Frontend
    console.log('📦 Compressing frontend_cpanel.zip...');
    execSync(
      `powershell -NoProfile -Command "Compress-Archive -Path '${clientDist}\\*' -DestinationPath '${frontendZip}' -Force"`,
      { stdio: 'inherit' }
    );

    // Compress Backend
    console.log('📦 Compressing backend_cpanel.zip...');
    execSync(
      `powershell -NoProfile -Command "Compress-Archive -Path '${backendStaging}\\*' -DestinationPath '${backendZip}' -Force"`,
      { stdio: 'inherit' }
    );
  } else {
    console.log('📦 Compressing frontend_cpanel.zip...');
    execSync(`cd "${clientDist}" && zip -r "${frontendZip}" .`, { stdio: 'inherit' });

    console.log('📦 Compressing backend_cpanel.zip...');
    execSync(`cd "${backendStaging}" && zip -r "${backendZip}" .`, { stdio: 'inherit' });
  }

  // Cleanup staging directory
  fs.rmSync(backendStaging, { recursive: true, force: true });

  console.log('\n======================================================');
  console.log('🎉 [cPanel Packaging Complete]');
  console.log(`1. Frontend Bundle: ${frontendZip}`);
  console.log(`   -> Upload and extract into cPanel: /public_html/`);
  console.log(`2. Backend Bundle:  ${backendZip}`);
  console.log(`   -> Upload and extract into cPanel Node.js app directory: /home/username/nodeapp/`);
  console.log('======================================================\n');
} catch (err) {
  console.error('❌ Error creating zip packages:', err);
  process.exit(1);
}
