import {
  WebFormField,
  FormConditionalRule,
  FormConditionPredicate,
  FormEvaluationResult,
  FormRoutingConfig,
  FormRoutingRule,
} from '../types/form';

/**
 * Evaluates an individual predicate rule against the current form field values
 */
export function evaluateConditionPredicate(
  predicate: FormConditionPredicate,
  values: Record<string, any>
): boolean {
  const rawValue = values[predicate.fieldId];
  const targetValue = predicate.value;

  switch (predicate.operator) {
    case 'equals': {
      if (rawValue === undefined || rawValue === null) {
        return targetValue === '' || targetValue === null || targetValue === undefined;
      }
      if (typeof rawValue === 'boolean') {
        return String(rawValue) === String(targetValue);
      }
      if (typeof rawValue === 'number') {
        return Number(rawValue) === Number(targetValue);
      }
      return String(rawValue).trim().toLowerCase() === String(targetValue).trim().toLowerCase();
    }

    case 'not_equals': {
      return !evaluateConditionPredicate({ ...predicate, operator: 'equals' }, values);
    }

    case 'contains': {
      if (rawValue === undefined || rawValue === null) return false;
      if (Array.isArray(rawValue)) {
        return rawValue.some(
          (item) => String(item).toLowerCase() === String(targetValue).toLowerCase()
        );
      }
      return String(rawValue).toLowerCase().includes(String(targetValue).toLowerCase());
    }

    case 'not_contains': {
      return !evaluateConditionPredicate({ ...predicate, operator: 'contains' }, values);
    }

    case 'greater_than': {
      const numVal = parseFloat(rawValue);
      const numTarget = parseFloat(targetValue);
      if (isNaN(numVal) || isNaN(numTarget)) return false;
      return numVal > numTarget;
    }

    case 'less_than': {
      const numVal = parseFloat(rawValue);
      const numTarget = parseFloat(targetValue);
      if (isNaN(numVal) || isNaN(numTarget)) return false;
      return numVal < numTarget;
    }

    case 'is_empty': {
      if (rawValue === undefined || rawValue === null) return true;
      if (typeof rawValue === 'string') return rawValue.trim().length === 0;
      if (Array.isArray(rawValue)) return rawValue.length === 0;
      return false;
    }

    case 'is_not_empty': {
      return !evaluateConditionPredicate({ ...predicate, operator: 'is_empty' }, values);
    }

    case 'in': {
      if (rawValue === undefined || rawValue === null) return false;
      let targetList: string[] = [];
      if (Array.isArray(targetValue)) {
        targetList = targetValue.map((v) => String(v).toLowerCase().trim());
      } else if (typeof targetValue === 'string') {
        targetList = targetValue.split(',').map((v) => v.toLowerCase().trim());
      }
      return targetList.includes(String(rawValue).toLowerCase().trim());
    }

    default:
      return false;
  }
}

/**
 * Reactive multi-pass conditional logic evaluation
 * Evaluates visibility, requirements, and value overrides across field dependencies
 */
export function evaluateFormConditionalLogic(
  fields: WebFormField[],
  values: Record<string, any>,
  rules: FormConditionalRule[]
): FormEvaluationResult {
  const visibility: Record<string, boolean> = {};
  const required: Record<string, boolean> = {};
  const currentValues: Record<string, any> = { ...values };
  const activeRuleIds: string[] = [];

  // 1. Initialize defaults based on field schema
  fields.forEach((field) => {
    visibility[field.id] = true;
    required[field.id] = field.required;
  });

  // Track if any rules explicitly manage visibility for fields with 'show' actions
  // If a field has a 'show' rule targeting it, it defaults to hidden until that rule is satisfied!
  const fieldsWithExplicitShowRule = new Set<string>();
  rules.forEach((rule) => {
    if (rule.action === 'show') {
      fieldsWithExplicitShowRule.add(rule.targetFieldId);
    }
  });

  fieldsWithExplicitShowRule.forEach((fieldId) => {
    visibility[fieldId] = false;
  });

  // 2. Multi-pass evaluation to support cascading rules (up to 3 passes to prevent infinite loops)
  const maxPasses = 3;
  for (let pass = 0; pass < maxPasses; pass++) {
    let changed = false;

    for (const rule of rules) {
      if (!rule.conditions || rule.conditions.length === 0) continue;

      const isMatch =
        rule.combinator === 'OR'
          ? rule.conditions.some((cond) => evaluateConditionPredicate(cond, currentValues))
          : rule.conditions.every((cond) => evaluateConditionPredicate(cond, currentValues));

      if (isMatch) {
        if (!activeRuleIds.includes(rule.id)) {
          activeRuleIds.push(rule.id);
        }

        switch (rule.action) {
          case 'show':
            if (!visibility[rule.targetFieldId]) {
              visibility[rule.targetFieldId] = true;
              changed = true;
            }
            break;

          case 'hide':
            if (visibility[rule.targetFieldId]) {
              visibility[rule.targetFieldId] = false;
              changed = true;
            }
            break;

          case 'require':
            if (!required[rule.targetFieldId]) {
              required[rule.targetFieldId] = true;
              changed = true;
            }
            break;

          case 'unrequire':
            if (required[rule.targetFieldId]) {
              required[rule.targetFieldId] = false;
              changed = true;
            }
            break;

          case 'set_value':
            if (currentValues[rule.targetFieldId] !== rule.setValue) {
              currentValues[rule.targetFieldId] = rule.setValue;
              changed = true;
            }
            break;
        }
      } else {
        // If an explicit 'show' rule did NOT match and no other show rule matched, remains false
        if (rule.action === 'show') {
          // If no other matching show rule exists, target stays false
        }
      }
    }

    if (!changed) break;
  }

  // 3. For any field that ended up hidden, requirement is automatically disabled
  fields.forEach((field) => {
    if (!visibility[field.id]) {
      required[field.id] = false;
    }
  });

  return {
    visibility,
    required,
    values: currentValues,
    activeRuleIds,
  };
}

/**
 * Resolves template merge tags in strings, e.g.:
 * "New Inquiry from {{client_name}} ({{company_name}})" -> "New Inquiry from ACME Corp"
 */
export function resolveFormMergeTags(
  template: string,
  values: Record<string, any>
): string {
  if (!template) return '';
  return template.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, fieldKey) => {
    const val = values[fieldKey];
    if (val === undefined || val === null) return '';
    return String(val);
  });
}

/**
 * Finds the highest priority matching conditional routing rule for a submission
 */
export function findMatchingRoutingRule(
  routing: FormRoutingConfig,
  submissionValues: Record<string, any>
): FormRoutingRule | null {
  if (!routing.conditionalRoutes || routing.conditionalRoutes.length === 0) {
    return null;
  }

  // Sort descending by priority (higher priority number wins)
  const sortedRoutes = [...routing.conditionalRoutes].sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
  );

  for (const rule of sortedRoutes) {
    if (!rule.conditions || rule.conditions.length === 0) continue;

    const isMatch =
      rule.combinator === 'OR'
        ? rule.conditions.some((cond) => evaluateConditionPredicate(cond, submissionValues))
        : rule.conditions.every((cond) => evaluateConditionPredicate(cond, submissionValues));

    if (isMatch) {
      return rule;
    }
  }

  return null;
}
