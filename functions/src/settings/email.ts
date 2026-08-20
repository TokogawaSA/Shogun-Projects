import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

// Initialize db if not already initialized
const db = admin.apps.length > 0 ? admin.firestore() : admin.initializeApp().firestore();

export interface SmtpConfigInput {
  host: string;
  port: number;
  secure?: boolean;
  username: string;
  password?: string;
}

export interface TestEmailConnectionRequest {
  tenantId?: string;
  provider: 'smtp' | 'sendgrid' | 'mailgun';
  fromEmail: string;
  fromName?: string;
  apiKey?: string;
  domain?: string;
  smtpSettings?: SmtpConfigInput;
  testRecipient?: string;
}

export interface TestEmailConnectionResponse {
  success: boolean;
  message: string;
  details?: any;
}

export interface SaveEmailCredentialsRequest {
  tenantId: string;
  provider: 'smtp' | 'sendgrid' | 'mailgun';
  fromEmail: string;
  fromName: string;
  apiKey?: string;
  domain?: string;
  smtpSettings?: SmtpConfigInput;
}

export interface SaveEmailCredentialsResponse {
  success: boolean;
  message: string;
}

/**
 * Cloud Functions Gen 2 Callable Function: testEmailConnection
 * Validates connection to the specified email gateway (SMTP, SendGrid, or Mailgun).
 */
export const testEmailConnection = onCall<
  TestEmailConnectionRequest,
  Promise<TestEmailConnectionResponse>
>(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication is required.');
  }

  const { provider, fromEmail, fromName, apiKey, domain, smtpSettings, testRecipient } =
    request.data;

  if (!provider || !fromEmail) {
    throw new HttpsError(
      'invalid-argument',
      'Missing required parameters: provider and fromEmail are mandatory.'
    );
  }

  try {
    if (provider === 'smtp') {
      if (!smtpSettings || !smtpSettings.host || !smtpSettings.port || !smtpSettings.username) {
        throw new HttpsError(
          'invalid-argument',
          'Missing SMTP parameters: host, port, and username are required.'
        );
      }

      const transporter = nodemailer.createTransport({
        host: smtpSettings.host,
        port: Number(smtpSettings.port),
        secure: smtpSettings.secure ?? Number(smtpSettings.port) === 465,
        auth: {
          user: smtpSettings.username,
          pass: smtpSettings.password || '',
        },
        connectionTimeout: 10000,
      });

      // Verify connection configuration
      await transporter.verify();

      if (testRecipient) {
        await transporter.sendMail({
          from: `"${fromName || 'VTiger Hub'}" <${fromEmail}>`,
          to: testRecipient,
          subject: '[Test] Email Gateway Verification',
          text: 'This is a test notification confirming your SMTP email configuration is operating properly.',
          html: '<p>This is a test notification confirming your <strong>SMTP</strong> email configuration is operating properly.</p>',
        });
      }

      return {
        success: true,
        message: 'SMTP transport connection verified successfully.',
      };
    } else if (provider === 'sendgrid') {
      if (!apiKey) {
        throw new HttpsError('invalid-argument', 'SendGrid API key is required.');
      }

      // Verify SendGrid API key by querying scopes endpoint
      const response = await fetch('https://api.sendgrid.com/v3/scopes', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`SendGrid API verification failed: ${response.status} - ${errorText}`);
      }

      if (testRecipient) {
        const mailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: testRecipient }] }],
            from: { email: fromEmail, name: fromName || 'VTiger Hub' },
            subject: '[Test] SendGrid Gateway Verification',
            content: [
              {
                type: 'text/html',
                value: '<p>Your <strong>SendGrid</strong> gateway credentials have been verified.</p>',
              },
            ],
          }),
        });

        if (!mailResponse.ok) {
          const mailErr = await mailResponse.text();
          throw new Error(`SendGrid test email dispatch failed: ${mailErr}`);
        }
      }

      return {
        success: true,
        message: 'SendGrid API connection verified successfully.',
      };
    } else if (provider === 'mailgun') {
      if (!apiKey || !domain) {
        throw new HttpsError(
          'invalid-argument',
          'Mailgun requires both API key and sending domain.'
        );
      }

      const authHeader = `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`;
      const domainCheck = await fetch(`https://api.mailgun.net/v3/domains/${domain}`, {
        method: 'GET',
        headers: { Authorization: authHeader },
      });

      if (!domainCheck.ok) {
        const errorText = await domainCheck.text();
        throw new Error(`Mailgun domain verification failed: ${domainCheck.status} - ${errorText}`);
      }

      return {
        success: true,
        message: `Mailgun domain (${domain}) connection verified successfully.`,
      };
    } else {
      throw new HttpsError('invalid-argument', `Unsupported email provider: ${provider}`);
    }
  } catch (error: any) {
    console.error(`[testEmailConnection Error]:`, error);
    return {
      success: false,
      message: error.message || 'Failed to establish email gateway connection.',
    };
  }
});

/**
 * Cloud Functions Gen 2 Callable Function: saveEmailCredentials
 * Persists validated email credentials into `tenants/{tenantId}/email_config/default`.
 * Enforces tenant admin authorization.
 */
export const saveEmailCredentials = onCall<
  SaveEmailCredentialsRequest,
  Promise<SaveEmailCredentialsResponse>
>(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication is required.');
  }

  const { tenantId, provider, fromEmail, fromName, apiKey, domain, smtpSettings } = request.data;

  if (!tenantId || !provider || !fromEmail) {
    throw new HttpsError(
      'invalid-argument',
      'Missing required parameters: tenantId, provider, and fromEmail are required.'
    );
  }

  const callerToken = request.auth.token;
  const isCallerTenantAdmin = callerToken.isTenantAdmin === true;
  const isCallerGlobalAdmin = callerToken.role === 'admin' || callerToken.admin === true;
  const isAuthorized = isCallerGlobalAdmin || (callerToken.tenantId === tenantId && isCallerTenantAdmin);

  if (!isAuthorized) {
    throw new HttpsError(
      'permission-denied',
      'Access denied: Only tenant administrators can configure email credentials.'
    );
  }

  try {
    const configDocRef = db.doc(`tenants/${tenantId}/email_config/default`);
    const payload: any = {
      provider,
      fromEmail,
      fromName: fromName || '',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: request.auth.uid,
    };

    if (provider === 'smtp' && smtpSettings) {
      payload.smtpSettings = {
        host: smtpSettings.host,
        port: Number(smtpSettings.port),
        secure: smtpSettings.secure ?? Number(smtpSettings.port) === 465,
        username: smtpSettings.username,
        password: smtpSettings.password || '',
      };
    } else if (provider === 'sendgrid' && apiKey) {
      payload.apiKey = apiKey;
    } else if (provider === 'mailgun') {
      if (apiKey) payload.apiKey = apiKey;
      if (domain) payload.domain = domain;
    }

    await configDocRef.set(payload, { merge: true });

    console.log(
      `[saveEmailCredentials] Successfully updated email config for tenant ${tenantId} by ${request.auth.uid}`
    );

    return {
      success: true,
      message: 'Email credentials successfully saved.',
    };
  } catch (error: any) {
    console.error(`[saveEmailCredentials Error]:`, error);
    throw new HttpsError('internal', error.message || 'Failed to save email configuration.');
  }
});
