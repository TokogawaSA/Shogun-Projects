/**
 * B2B & B2C Customer Segment Utilities for the CRM Module
 *
 * Provides segment resolution, customFields dot-path getters/setters,
 * and segment-aware layout filtering so Leads, Accounts, Contacts, and Deals
 * seamlessly accommodate both Business-to-Business (B2B) organizations and
 * Business-to-Consumer (B2C) individual customers.
 */

import { BlockLayout, CustomerSegment, FieldDefinition } from '../../../types/crmEntities';

const B2C_ACCOUNT_TYPES = new Set(['individual', 'consumer', 'household']);
const B2C_DEAL_TYPES = new Set(['b2c_direct', 'b2c_subscription']);

/**
 * Resolves the effective CustomerSegment ('B2B' | 'B2C') for any CRM record.
 * Checks explicit `customerSegment` and `customFields.customerSegment` first,
 * then falls back to safe heuristics based on accountType / dealType / company.
 */
export function getRecordSegment(record?: Record<string, any> | null): CustomerSegment {
  if (!record) return 'B2B';

  const explicit = record.customerSegment || record.customFields?.customerSegment;
  if (explicit === 'B2C' || explicit === 'b2c') return 'B2C';
  if (explicit === 'B2B' || explicit === 'b2b') return 'B2B';

  const accountType = String(record.accountType || '').toLowerCase();
  if (B2C_ACCOUNT_TYPES.has(accountType)) return 'B2C';

  const dealType = String(record.dealType || '').toLowerCase();
  if (B2C_DEAL_TYPES.has(dealType)) return 'B2C';

  // Nested account relation (when returned by Contacts/Deals API)
  const nestedAccountSegment =
    record.account?.customerSegment || record.account?.customFields?.customerSegment;
  if (nestedAccountSegment === 'B2C' || nestedAccountSegment === 'b2c') return 'B2C';

  const nestedAccountType = String(record.account?.accountType || '').toLowerCase();
  if (B2C_ACCOUNT_TYPES.has(nestedAccountType)) return 'B2C';

  // Leads explicitly marked as Individual
  if (
    typeof record.company === 'string' &&
    record.company.trim().toLowerCase() === 'individual'
  ) {
    return 'B2C';
  }

  return 'B2B';
}

/**
 * Reads a field value from a CRM record, supporting both top-level fields
 * and `customFields.<key>` dot-notation paths.
 */
export function getEntityFieldValue(record: Record<string, any> | null | undefined, fieldName: string): any {
  if (!record) return undefined;

  if (fieldName.startsWith('customFields.')) {
    const key = fieldName.slice('customFields.'.length);
    if (key === 'customerSegment') {
      return getRecordSegment(record);
    }
    return record.customFields?.[key];
  }

  if (fieldName === 'accountName' && !record.accountName && record.account?.accountName) {
    return record.account.accountName;
  }

  if (fieldName === 'contactName' && !record.contactName && record.contact) {
    return `${record.contact.firstName || ''} ${record.contact.lastName || ''}`.trim();
  }

  if (fieldName === 'assignedUserName' && !record.assignedUserName && record.assignedUser) {
    return record.assignedUser.displayName || record.assignedUser.email;
  }

  return record[fieldName];
}

/**
 * Applies a field update (including `customFields.<key>`) to a form state object
 * immutably without losing sibling customFields keys.
 */
export function setEntityFieldValue(
  prev: Record<string, any>,
  fieldName: string,
  value: any
): Record<string, any> {
  if (fieldName.startsWith('customFields.')) {
    const key = fieldName.slice('customFields.'.length);
    return {
      ...prev,
      customFields: {
        ...(prev.customFields || {}),
        [key]: value,
      },
    };
  }
  return {
    ...prev,
    [fieldName]: value,
  };
}

/**
 * Filters layout blocks and their fields according to the active CustomerSegment.
 */
export function filterBlocksBySegment(
  blocks: BlockLayout[],
  segment: CustomerSegment
): BlockLayout[] {
  return blocks
    .filter((block) => !block.visibilitySegment || block.visibilitySegment === 'ALL' || block.visibilitySegment === segment)
    .map((block) => {
      const fields: FieldDefinition[] = block.fields.filter(
        (field) =>
          !field.visibilitySegment ||
          field.visibilitySegment === 'ALL' ||
          field.visibilitySegment === segment
      );
      return { ...block, fields };
    })
    .filter((block) => block.fields.length > 0);
}

/**
 * Display metadata for B2B vs B2C badges.
 */
export function getSegmentMeta(segment: CustomerSegment) {
  if (segment === 'B2C') {
    return {
      label: 'B2C',
      fullLabel: 'B2C Consumer',
      description: 'Individual customer, retail buyer, or household',
      badgeClasses: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    };
  }
  return {
    label: 'B2B',
    fullLabel: 'B2B Business',
    description: 'Corporate organization, enterprise, or commercial partner',
    badgeClasses: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  };
}
