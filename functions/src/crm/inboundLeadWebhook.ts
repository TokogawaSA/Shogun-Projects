import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

// Initialize db if not already initialized
const db = admin.apps.length > 0 ? admin.firestore() : admin.initializeApp().firestore();

const WEBHOOK_API_SECRET = process.env.CRM_WEBHOOK_SECRET || 'shogun-crm-webhook-secret-token';

/**
 * Cloud Functions Gen 2 HTTP Webhook Endpoint: inboundLeadWebhook
 * Ingests inbound leads from external forms, webhooks, or marketing funnels.
 * Security: Bearer Token or X-CRM-Signature check.
 * Logic:
 * 1. Checks duplicate contact by email.
 * 2. Checks duplicate account by domain or company name.
 * 3. Creates/updates account and contact documents.
 * 4. Initializes a new deal in 'discovery' stage.
 */
export const inboundLeadWebhook = onRequest(
  { cors: true },
  async (req, res) => {
    // Only accept POST requests
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
      return;
    }

    // Security Verification: Bearer token or Secret header
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const signatureHeader = (req.headers['x-crm-signature'] || req.headers['x-api-key']) as string;

    if (
      token !== WEBHOOK_API_SECRET &&
      signatureHeader !== WEBHOOK_API_SECRET &&
      process.env.NODE_ENV === 'production'
    ) {
      res.status(401).json({ error: 'Unauthorized: Invalid CRM API signature or token.' });
      return;
    }

    const {
      email,
      firstName,
      lastName,
      companyName,
      notes,
      leadSource = 'Inbound Webhook',
      tenantId = 'tenant-default',
    } = req.body || {};

    if (!email || !firstName) {
      res.status(400).json({ error: 'Bad Request: email and firstName are required fields.' });
      return;
    }

    try {
      const sanitizedEmail = String(email).trim().toLowerCase();
      const domain = sanitizedEmail.includes('@') ? sanitizedEmail.split('@')[1] : 'client.com';
      const company = companyName ? String(companyName).trim() : domain.split('.')[0];
      const now = new Date().toISOString();

      // 1. Check/Create Account
      let accountId: string;
      const accountQuery = await db
        .collection('accounts')
        .where('domain', '==', domain)
        .limit(1)
        .get();

      if (!accountQuery.empty) {
        accountId = accountQuery.docs[0].id;
      } else {
        accountId = `acc-${Date.now().toString(36)}`;
        const newAccount = {
          id: accountId,
          tenantId,
          name: company.charAt(0).toUpperCase() + company.slice(1),
          domain,
          industry: 'Inbound Opportunity',
          tier: 'starter',
          status: 'prospect',
          assignedOwnerId: 'usr-admin-master',
          billingDetails: { currency: 'USD' },
          customFields: { source: leadSource, initialNotes: notes || '' },
          createdAt: now,
          updatedAt: now,
        };
        await db.collection('accounts').doc(accountId).set(newAccount);
      }

      // 2. Check/Create Contact
      let contactId: string;
      const contactQuery = await db
        .collection('contacts')
        .where('email', '==', sanitizedEmail)
        .limit(1)
        .get();

      if (!contactQuery.empty) {
        contactId = contactQuery.docs[0].id;
        await db.collection('contacts').doc(contactId).update({
          lastContactedAt: now,
          updatedAt: now,
        });
      } else {
        contactId = `cnt-${Date.now().toString(36)}`;
        const newContact = {
          id: contactId,
          tenantId,
          accountId,
          firstName: String(firstName).trim(),
          lastName: String(lastName || '').trim(),
          email: sanitizedEmail,
          isPrimaryContact: true,
          lifecycleStage: 'lead',
          lastContactedAt: now,
          createdAt: now,
          updatedAt: now,
        };
        await db.collection('contacts').doc(contactId).set(newContact);
      }

      // 3. Create Discovery Opportunity / Deal
      const dealId = `del-${Date.now().toString(36)}`;
      const newDeal = {
        id: dealId,
        tenantId,
        title: `${company} - ${leadSource} Lead Opportunity`,
        accountId,
        primaryContactId: contactId,
        pipelineStage: 'discovery',
        value: 25000,
        currency: 'USD',
        winProbability: 20,
        expectedCloseDate: new Date(Date.now() + 3600000 * 24 * 30).toISOString(),
        linkedProjectId: null,
        assignedRepId: 'usr-admin-master',
        createdAt: now,
        updatedAt: now,
      };

      await db.collection('deals').doc(dealId).set(newDeal);

      res.status(201).json({
        success: true,
        message: 'Inbound lead ingested successfully.',
        data: {
          accountId,
          contactId,
          dealId,
          pipelineStage: 'discovery',
        },
      });
    } catch (error: any) {
      console.error('[inboundLeadWebhook Error]:', error);
      res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
  }
);
