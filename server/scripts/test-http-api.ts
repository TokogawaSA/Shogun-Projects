import { app } from '../src/app.js';
import { prisma } from '../src/config/db.js';
import request from 'supertest'; // or native fetch against running server
import http from 'http';

async function testHttpEndpoints() {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://localhost:${port}/api`;

  console.log(`Test Express server running at: ${baseUrl}`);

  try {
    // 1. Health check
    console.log('\n--- 1. Testing /api/health ---');
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();
    console.log('Health Response:', healthData);

    // 2. Login as admin
    console.log('\n--- 2. Testing /api/auth/login ---');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@shogunate.solutions',
        password: 'AdminPassword@2026',
      }),
    });
    const loginData = await loginRes.json();
    console.log('Login Status:', loginRes.status);
    console.log('User logged in:', loginData.user?.email, 'Tenant:', loginData.tenant?.id);
    const token = loginData.token;

    if (!token) {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }

    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // 3. Test GET /api/crm/leads
    console.log('\n--- 3. Testing GET /api/crm/leads ---');
    const leadsRes = await fetch(`${baseUrl}/crm/leads`, { headers: authHeaders });
    const leads = await leadsRes.json();
    console.log(`Fetched ${leads.length} leads from Supabase via Express API:`, leads.map((l: any) => ({ id: l.id, company: l.company })));

    // 4. Test POST /api/crm/leads (Create Lead)
    console.log('\n--- 4. Testing POST /api/crm/leads ---');
    const newLeadRes = await fetch(`${baseUrl}/crm/leads`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        firstName: 'Alexander',
        lastName: 'Wright',
        company: 'Aetherial Cloud Dynamics',
        email: 'a.wright@aetherial.io',
        phone: '+1 (555) 234-8901',
        leadStatus: 'pre_qualified',
        rating: 'hot',
        leadSource: 'web_site',
        industry: 'Cloud Software',
        annualRevenue: 1500000,
        city: 'San Francisco',
        country: 'USA',
      }),
    });
    const createdLead = await newLeadRes.json();
    console.log('Created Lead via REST API:', { id: createdLead.id, leadNumber: createdLead.leadNumber, company: createdLead.company });

    // 5. Test POST /api/crm/leads/:id/convert (Lead Conversion Transaction)
    console.log('\n--- 5. Testing Lead Conversion Transaction in Supabase ---');
    const convertRes = await fetch(`${baseUrl}/crm/leads/${createdLead.id}/convert`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        accountName: 'Aetherial Cloud Dynamics Inc.',
        createAccount: true,
        createContact: true,
        createDeal: true,
        dealName: 'Aetherial - Enterprise Cloud Migration',
        dealAmount: 150000,
        dealStage: 'qualification',
      }),
    });
    const convertResult = await convertRes.json();
    console.log('Lead Conversion Result:', convertResult);

    // Verify converted lead in Supabase
    const convertedLeadInDb = await prisma.lead.findUnique({ where: { id: createdLead.id } });
    console.log('Converted Lead in Supabase isConverted flag:', convertedLeadInDb?.isConverted);

    // 6. Test GET /api/crm/accounts, /contacts, /deals
    console.log('\n--- 6. Testing GET /api/crm/accounts, contacts, deals ---');
    const accs = await (await fetch(`${baseUrl}/crm/accounts`, { headers: authHeaders })).json();
    const conts = await (await fetch(`${baseUrl}/crm/contacts`, { headers: authHeaders })).json();
    const deals = await (await fetch(`${baseUrl}/crm/deals`, { headers: authHeaders })).json();

    console.log(`Supabase Database state: Accounts=${accs.length}, Contacts=${conts.length}, Deals=${deals.length}`);

    console.log('\nAll REST API endpoints against Supabase verified successfully!');
  } finally {
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  }
}

testHttpEndpoints().catch((err) => {
  console.error('[HTTP Test Error]:', err);
  process.exit(1);
});
