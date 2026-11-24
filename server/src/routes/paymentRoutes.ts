import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { withTenantTx } from '../utils/tenantTx.js';
import {
  createCheckoutSession,
  handlePeachWebhook,
  PeachWebhookSignatureError,
} from '../services/peachPaymentsService.js';

export const peachWebhookRouter = Router();
export const portalPaymentRouter = Router();

/**
 * POST /api/v1/webhooks/peach-payments
 * Public inbound Peach Payments V2 webhook receiver verified by HMAC-SHA256 signature.
 */
peachWebhookRouter.post('/peach-payments', async (req: Request, res: Response) => {
  try {
    const signature =
      (typeof req.headers['x-peach-signature'] === 'string'
        ? req.headers['x-peach-signature']
        : undefined) ||
      (typeof req.headers['x-signature'] === 'string'
        ? req.headers['x-signature']
        : undefined);

    const rawBody = (req as any).rawBody as string | undefined;
    const result = await handlePeachWebhook(req.body || {}, signature, { rawBody });

    res.status(200).json(result);
  } catch (err: any) {
    if (err instanceof PeachWebhookSignatureError || err.status === 401) {
      res.status(401).json({ error: err.message });
      return;
    }
    res.status(err.status || 500).json({
      error: err.message || 'Failed to process Peach Payments webhook.',
    });
  }
});

const createCheckoutBodySchema = z.object({
  defaultPaymentMethod: z
    .enum(['CARD', 'PAYSHAP', 'CAPITECPAY', 'PAYBYBANK'])
    .optional(),
  createRegistration: z.boolean().optional(),
  amount: z.coerce.number().positive().optional(),
  shopperResultUrl: z.string().url().optional(),
});

/**
 * GET /api/v1/portal/invoices
 * Retrieve tenant TaxInvoices with payment history for the Client Portal.
 */
portalPaymentRouter.get('/invoices', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const invoices = await withTenantTx(tenantId, async (tx) => {
      return tx.taxInvoice.findMany({
        where: { tenantId },
        include: {
          account: { select: { id: true, accountName: true, accountNumber: true } },
          project: { select: { id: true, title: true, code: true } },
          paymentTransactions: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    res.json({ invoices });
  } catch (err: any) {
    res.status(500).json({
      error: err.message || 'Failed to load Client Portal tax invoices.',
    });
  }
});

/**
 * GET /api/v1/portal/invoices/:id
 */
portalPaymentRouter.get('/invoices/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const invoice = await withTenantTx(tenantId, async (tx) => {
      return tx.taxInvoice.findFirst({
        where: { id, tenantId },
        include: {
          account: { select: { id: true, accountName: true, accountNumber: true } },
          project: { select: { id: true, title: true, code: true } },
          paymentTransactions: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    });

    if (!invoice) {
      res.status(404).json({ error: 'TaxInvoice not found.' });
      return;
    }

    res.json({ invoice });
  } catch (err: any) {
    res.status(500).json({
      error: err.message || 'Failed to load TaxInvoice details.',
    });
  }
});

/**
 * POST /api/v1/portal/invoices/:id/checkout
 * Create a Peach Payments V2 ZAR Checkout Session for a TaxInvoice.
 */
portalPaymentRouter.post('/invoices/:id/checkout', async (req: Request, res: Response) => {
  try {
    const parsed = createCheckoutBodySchema.safeParse(req.body || {});
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid Peach checkout request payload.',
        details: parsed.error.flatten(),
      });
      return;
    }

    const session = await createCheckoutSession(
      req.user!.tenantId,
      req.params.id,
      parsed.data
    );

    res.status(201).json(session);
  } catch (err: any) {
    res.status(err.status || 500).json({
      error: err.message || 'Failed to initialize Peach Payments V2 checkout session.',
    });
  }
});

/**
 * GET /api/v1/portal/payments/:merchantTransactionId/status
 * Poll real-time payment confirmation upon shopper return to `shopperResultUrl`.
 */
portalPaymentRouter.get(
  '/payments/:merchantTransactionId/status',
  async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const { merchantTransactionId } = req.params;

      const paymentTx = await withTenantTx(tenantId, async (tx) => {
        return tx.paymentTransaction.findFirst({
          where: {
            tenantId,
            merchantTransactionId,
          },
          include: {
            taxInvoice: {
              select: {
                id: true,
                invoiceNumber: true,
                status: true,
                totalInclVat: true,
                amountPaid: true,
                currency: true,
              },
            },
          },
        });
      });

      if (!paymentTx) {
        res.status(404).json({ error: 'Payment transaction not found.' });
        return;
      }

      res.json({
        merchantTransactionId: paymentTx.merchantTransactionId,
        checkoutId: paymentTx.checkoutId,
        status: paymentTx.status,
        resultCode: paymentTx.resultCode,
        amount: Number(paymentTx.amount),
        currency: paymentTx.currency,
        paymentMethod: paymentTx.paymentMethod,
        settledAt: paymentTx.settledAt,
        taxInvoice: paymentTx.taxInvoice,
      });
    } catch (err: any) {
      res.status(500).json({
        error: err.message || 'Failed to check payment confirmation status.',
      });
    }
  }
);

export default portalPaymentRouter;
