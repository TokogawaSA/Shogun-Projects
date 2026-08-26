import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticateTenant, requireTenantAdmin, requireRoles } from '../src/middleware/auth.js';
import { AuthUserClaims } from '../src/types/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_32chars_min';

async function runTests() {
  console.log('================================================================');
  console.log('  PHASE 2 VERIFICATION SUITE: JWT & MULTI-TENANT AUTH GATE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, description: string) {
    if (condition) {
      console.log(`  [PASS] ${description}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${description}`);
      failed++;
    }
  }

  // 1. Password Hashing & Verification Test
  console.log('1. Testing Bcrypt Password Hashing & Comparison...');
  const plainPassword = 'SuperSecurePassword123!';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(plainPassword, salt);

  assert(typeof hash === 'string' && hash.startsWith('$2'), 'Bcrypt password hashed successfully');
  assert(await bcrypt.compare(plainPassword, hash), 'Bcrypt correctly verifies valid plain password');
  assert(!(await bcrypt.compare('WrongPassword', hash)), 'Bcrypt rejects invalid plain password');

  // 2. JWT Generation & Verification Test
  console.log('\n2. Testing Multi-Tenant JWT Token Issuance & Claims Verification...');
  const testClaims: AuthUserClaims = {
    userId: 'user_cuid_12345',
    tenantId: 'tenant_cuid_67890',
    email: 'admin@shogunate.io',
    role: 'admin',
    isTenantAdmin: true,
    profileId: 'profile_admin_001',
    roleId: 'role_top_level',
  };

  const token = jwt.sign(testClaims, JWT_SECRET, { expiresIn: '7d' });
  assert(typeof token === 'string' && token.split('.').length === 3, 'JWT signed with header, payload, and signature');

  const decoded = jwt.verify(token, JWT_SECRET) as AuthUserClaims;
  assert(decoded.userId === testClaims.userId, 'JWT claims preserve userId');
  assert(decoded.tenantId === testClaims.tenantId, 'JWT claims preserve multi-tenant tenantId');
  assert(decoded.isTenantAdmin === true, 'JWT claims preserve isTenantAdmin');
  assert(decoded.profileId === testClaims.profileId, 'JWT claims preserve profileId');

  // 3. AuthenticateTenant Middleware Test
  console.log('\n3. Testing authenticateTenant Middleware Isolation...');
  
  // Valid token case
  let mockReq: any = {
    headers: { authorization: `Bearer ${token}` },
  };
  let mockRes: any = {
    statusCode: 200,
    status(code: number) { this.statusCode = code; return this; },
    json(data: any) { this.body = data; return this; },
  };
  let nextCalled = false;
  authenticateTenant(mockReq, mockRes, () => { nextCalled = true; });
  assert(nextCalled === true, 'authenticateTenant calls next() on valid Bearer token');
  assert(mockReq.user?.tenantId === testClaims.tenantId, 'authenticateTenant attaches tenant context to req.user');

  // Missing Authorization header case
  mockReq = { headers: {} };
  mockRes = {
    statusCode: 200,
    status(code: number) { this.statusCode = code; return this; },
    json(data: any) { this.body = data; return this; },
  };
  nextCalled = false;
  authenticateTenant(mockReq, mockRes, () => { nextCalled = true; });
  assert(nextCalled === false && mockRes.statusCode === 401, 'authenticateTenant returns 401 on missing Authorization header');

  // Invalid Token case
  mockReq = { headers: { authorization: 'Bearer invalid.tampered.token' } };
  mockRes = {
    statusCode: 200,
    status(code: number) { this.statusCode = code; return this; },
    json(data: any) { this.body = data; return this; },
  };
  nextCalled = false;
  authenticateTenant(mockReq, mockRes, () => { nextCalled = true; });
  assert(nextCalled === false && mockRes.statusCode === 401, 'authenticateTenant returns 401 on invalid/tampered token');

  // 4. RequireTenantAdmin Middleware Test
  console.log('\n4. Testing requireTenantAdmin Authorization Gate...');
  
  // Admin user
  mockReq = { user: { userId: 'u1', tenantId: 't1', isTenantAdmin: true } };
  nextCalled = false;
  requireTenantAdmin(mockReq, mockRes, () => { nextCalled = true; });
  assert(nextCalled === true, 'requireTenantAdmin allows isTenantAdmin: true user to proceed');

  // Non-Admin user
  mockReq = { user: { userId: 'u2', tenantId: 't1', isTenantAdmin: false } };
  mockRes = {
    statusCode: 200,
    status(code: number) { this.statusCode = code; return this; },
    json(data: any) { this.body = data; return this; },
  };
  nextCalled = false;
  requireTenantAdmin(mockReq, mockRes, () => { nextCalled = true; });
  assert(nextCalled === false && mockRes.statusCode === 403, 'requireTenantAdmin blocks non-admin user with 403 Forbidden');

  // 5. RequireRoles Middleware Test
  console.log('\n5. Testing requireRoles Role-Based Access Control...');
  const managerGuard = requireRoles(['admin', 'project_manager']);
  
  mockReq = { user: { userId: 'u3', tenantId: 't1', role: 'developer', isTenantAdmin: false } };
  mockRes = {
    statusCode: 200,
    status(code: number) { this.statusCode = code; return this; },
    json(data: any) { this.body = data; return this; },
  };
  nextCalled = false;
  managerGuard(mockReq, mockRes, () => { nextCalled = true; });
  assert(nextCalled === false && mockRes.statusCode === 403, 'requireRoles blocks developer from project_manager routes');

  mockReq = { user: { userId: 'u4', tenantId: 't1', role: 'project_manager', isTenantAdmin: false } };
  nextCalled = false;
  managerGuard(mockReq, mockRes, () => { nextCalled = true; });
  assert(nextCalled === true, 'requireRoles allows project_manager to proceed');

  console.log('\n================================================================');
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
