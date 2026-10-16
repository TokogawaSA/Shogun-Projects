/**
 * Server-Side Conditional Logic Engine for Form Evaluation & Routing
 * Antigravity 2.0 Backend
 */

export interface FormConditionPredicate {
  fieldId: string;
  operator:
    | 'equals'
    | 'not_equals'
    | 'contains'
    | 'not_contains'
    | 'greater_than'
    | 'less_than'
    | 'is_empty'
    | 'is_not_empty'
    | 'in';
  value: any;
}

export interface FormRoutingRule {
  id: string;
  name: string;
  priority: number;
  combinator: 'AND' | 'OR';
  conditions: FormConditionPredicate[];
  action: {
    targetModule: 'leads' | 'deals' | 'projects' | 'tasks' | 'accounts' | 'contacts';
    fieldMappings: Record<string, string>;
    autoAssignUserId?: string;
    defaultStatus?: string;
    tags?: string[];
    triggerWorkflowId?: string;
    createSecondaryProject?: boolean;
    secondaryProjectName?: string;
  };
}

export interface FormRoutingConfig {
  defaultRoute: {
    targetModule: 'leads' | 'deals' | 'projects' | 'tasks';
    fieldMappings: Record<string, string>;
    triggerWorkflowId?: string;
    autoAssignUserId?: string;
    defaultStatus?: string;
    createSecondaryProject?: boolean;
    secondaryProjectName?: string;
  };
  conditionalRoutes: FormRoutingRule[];
}

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

export function resolveFormMergeTags(template: string, values: Record<string, any>): string {
  if (!template) return '';
  return template.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, fieldKey) => {
    const val = values[fieldKey];
    if (val === undefined || val === null) return '';
    return String(val);
  });
}

export function findMatchingRoutingRule(
  routing: FormRoutingConfig,
  submissionValues: Record<string, any>
): FormRoutingRule | null {
  if (!routing.conditionalRoutes || routing.conditionalRoutes.length === 0) {
    return null;
  }

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
