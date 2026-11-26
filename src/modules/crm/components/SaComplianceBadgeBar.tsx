import React from 'react';
import {
  Building2,
  Receipt,
  Award,
  Landmark,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  MessageCircle,
  CreditCard,
  Star,
} from 'lucide-react';
import clsx from 'clsx';
import { getRecordSegment } from '../utils/customerSegment';

export interface SaComplianceBadgeBarProps {
  record: Record<string, any>;
}

const CIPC_PATTERN = /^(?:19|20)\d{2}\/\d{6}\/\d{2}$/;
const SA_VAT_PATTERN = /^4\d{9}$/;
const CSD_PATTERN = /^MAAA\d{7}$/;

const BBBEE_RECOGNITION_MAP: Record<number, string> = {
  1: '135% Recognition',
  2: '125% Recognition',
  3: '110% Recognition',
  4: '100% Recognition',
  5: '80% Recognition',
  6: '60% Recognition',
  7: '50% Recognition',
  8: '10% Recognition',
  0: '0% (Non-Compliant)',
};

export const SaComplianceBadgeBar: React.FC<SaComplianceBadgeBarProps> = ({ record }) => {
  const custom = (record.customFields as Record<string, any>) || {};
  const segment = getRecordSegment(record);

  // Render B2C Consumer & POPIA Verification Bar for Individual / Consumer records
  if (segment === 'B2C') {
    const nationalId: string | null = custom.nationalIdNumber || null;
    const saIdValid = Boolean(nationalId && /^\d{13}$/.test(nationalId.trim()));
    const marketingOptIn = Boolean(custom.marketingOptIn);
    const preferredChannel: string = custom.preferredChannel || 'Not Set';
    const loyaltyTier: string = custom.loyaltyTier || 'Standard';

    return (
      <div className="p-4 rounded-2xl bg-slate-900/85 border border-teal-500/20 shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-400">
            B2C Consumer Profile & POPIA Privacy Compliance
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            POPIA Consent • Identity • Channel • Loyalty
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {/* 1. POPIA Marketing Consent */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2.5">
            <div className="p-2 rounded-lg bg-teal-500/15 text-teal-400 border border-teal-500/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-mono uppercase text-slate-400">
                  POPIA Consent
                </span>
                <span
                  className={clsx(
                    'text-[9px] font-mono px-1.5 py-0.5 rounded border',
                    marketingOptIn
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  )}
                >
                  {marketingOptIn ? 'OPTED IN' : 'NO CONSENT'}
                </span>
              </div>
              <p className="text-xs font-mono font-bold text-slate-100 truncate mt-0.5">
                {marketingOptIn ? 'Direct Marketing Allowed' : 'Transactional Only'}
              </p>
            </div>
          </div>

          {/* 2. Preferred Channel */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">
                Preferred Channel
              </span>
              <p className="text-xs font-mono font-bold text-slate-100 truncate mt-0.5 capitalize">
                {preferredChannel}
              </p>
            </div>
          </div>

          {/* 3. Loyalty Tier */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Star className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">
                Loyalty Tier
              </span>
              <p className="text-xs font-mono font-bold text-slate-100 truncate mt-0.5 capitalize">
                {loyaltyTier}
              </p>
            </div>
          </div>

          {/* 4. Consumer Identity Verification */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30">
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-mono uppercase text-slate-400">
                  ID / Passport
                </span>
                {nationalId && (
                  <span
                    className={clsx(
                      'text-[9px] font-mono px-1.5 py-0.5 rounded border',
                      saIdValid
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                    )}
                  >
                    {saIdValid ? 'SA ID' : 'RECORDED'}
                  </span>
                )}
              </div>
              <p className="text-xs font-mono font-bold text-slate-100 truncate mt-0.5">
                {nationalId ? `••••••${nationalId.slice(-4)}` : 'Not Provided'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const cipc: string | null =
    record.cipcRegistrationNumber || custom.cipcRegistrationNumber || null;
  const vat: string | null =
    record.vatRegistrationNumber || custom.vatRegistrationNumber || null;
  const bbbeeLevel: number | null =
    record.bbbeeLevel !== undefined && record.bbbeeLevel !== null
      ? Number(record.bbbeeLevel)
      : custom.bbbeeLevel !== undefined
      ? Number(custom.bbbeeLevel)
      : null;
  const bbbeeExpiryRaw = record.bbbeeExpiryDate || custom.bbbeeExpiryDate || null;
  const csd: string | null =
    record.csdSupplierNumber || custom.csdSupplierNumber || null;

  const cipcValid = Boolean(cipc && CIPC_PATTERN.test(cipc.trim()));
  const vatValid = Boolean(vat && SA_VAT_PATTERN.test(vat.trim()));
  const csdValid = Boolean(csd && CSD_PATTERN.test(csd.trim()));

  let expiryState: 'valid' | 'expiring_soon' | 'expired' | 'unset' = 'unset';
  let daysRemaining: number | null = null;
  let formattedExpiry = '';

  if (bbbeeExpiryRaw) {
    const expDate = new Date(bbbeeExpiryRaw);
    if (!Number.isNaN(expDate.getTime())) {
      formattedExpiry = expDate.toISOString().slice(0, 10);
      daysRemaining = Math.ceil((expDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
      if (daysRemaining < 0) {
        expiryState = 'expired';
      } else if (daysRemaining <= 30) {
        expiryState = 'expiring_soon';
      } else {
        expiryState = 'valid';
      }
    }
  }

  return (
    <div className="p-4 rounded-2xl bg-slate-900/85 border border-slate-800 shadow-lg backdrop-blur-md">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
          South African B2B Statutory & Preferential Procurement Compliance
        </span>
        <span className="text-[10px] font-mono text-slate-400">
          CIPC • SARS VAT • B-BBEE • National Treasury CSD
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {/* 1. CIPC Registration */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">
                CIPC Reg #
              </span>
              {cipc && (
                <span
                  className={clsx(
                    'text-[9px] font-mono px-1.5 py-0.5 rounded border',
                    cipcValid
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  )}
                >
                  {cipcValid ? 'VERIFIED' : 'CHECK FORMAT'}
                </span>
              )}
            </div>
            <p className="text-xs font-mono font-bold text-slate-100 truncate mt-0.5">
              {cipc || 'Not Registered'}
            </p>
          </div>
        </div>

        {/* 2. SARS VAT Number */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <Receipt className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">
                SARS VAT #
              </span>
              {vat && (
                <span
                  className={clsx(
                    'text-[9px] font-mono px-1.5 py-0.5 rounded border',
                    vatValid
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  )}
                >
                  {vatValid ? '15% VAT VENDOR' : 'INVALID'}
                </span>
              )}
            </div>
            <p className="text-xs font-mono font-bold text-slate-100 truncate mt-0.5">
              {vat || 'Non-VAT Vendor'}
            </p>
          </div>
        </div>

        {/* 3. B-BBEE Level + Expiry Badge */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Award className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">
                B-BBEE Status
              </span>
              {expiryState !== 'unset' && (
                <span
                  className={clsx(
                    'text-[9px] font-mono px-1.5 py-0.5 rounded border inline-flex items-center gap-1',
                    expiryState === 'valid'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : expiryState === 'expiring_soon'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  )}
                >
                  {expiryState === 'valid' && <CheckCircle2 className="w-2.5 h-2.5" />}
                  {expiryState === 'expiring_soon' && <Clock className="w-2.5 h-2.5" />}
                  {expiryState === 'expired' && <AlertTriangle className="w-2.5 h-2.5" />}
                  {expiryState === 'valid'
                    ? `Exp ${formattedExpiry}`
                    : expiryState === 'expiring_soon'
                    ? `${daysRemaining}d Left`
                    : 'EXPIRED'}
                </span>
              )}
            </div>
            <p className="text-xs font-mono font-bold text-slate-100 truncate mt-0.5">
              {bbbeeLevel === null
                ? 'Unverified'
                : bbbeeLevel === 0
                ? 'Non-Compliant'
                : `Level ${bbbeeLevel} (${BBBEE_RECOGNITION_MAP[bbbeeLevel] || ''})`}
            </p>
          </div>
        </div>

        {/* 4. National Treasury CSD Supplier Number */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2.5">
          <div className="p-2 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <Landmark className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">
                Treasury CSD #
              </span>
              {csd && (
                <span
                  className={clsx(
                    'text-[9px] font-mono px-1.5 py-0.5 rounded border',
                    csdValid
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  )}
                >
                  {csdValid ? 'ACTIVE CSD' : 'CHECK CSD'}
                </span>
              )}
            </div>
            <p className="text-xs font-mono font-bold text-slate-100 truncate mt-0.5">
              {csd || 'Not Enrolled'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaComplianceBadgeBar;
