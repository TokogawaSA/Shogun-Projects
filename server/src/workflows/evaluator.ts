/**
 * Workflow Token Evaluator & Predicate Resolver
 * Handles field predicate rule comparisons and mustache merge tag interpolation
 */

export interface RulePredicate {
  field: string;
  operator:
    | 'equals'
    | 'not_equals'
    | 'greater_than'
    | 'less_than'
    | 'contains'
    | 'starts_with'
    | 'is_empty'
    | 'is_not_empty';
  value: any;
}

export interface ConditionData {
  logicalOperator?: 'AND' | 'OR';
  rules?: RulePredicate[];
}

/**
 * Resolves a nested field path like "deal.primaryContact.email" or "amount" from context object
 */
export function getNestedProperty(obj: Record<string, any>, path: string): any {
  if (!obj || !path) return undefined;
  
  // Strip optional surrounding brackets or braces if present
  const cleanPath = path.replace(/[\{\}]/g, '').trim();
  const keys = cleanPath.split('.');
  
  let current: any = obj;
  for (const key of keys) {
    if (current === null || current === undefined) return undefined;
    // Check direct property or try matching case-insensitively
    if (key in current) {
      current = current[key];
    } else {
      const foundKey = Object.keys(current).find((k) => k.toLowerCase() === key.toLowerCase());
      if (foundKey) {
        current = current[foundKey];
      } else {
        return undefined;
      }
    }
  }
  return current;
}

/**
 * Evaluates field condition rules against incoming event payload context
 */
export function evaluateCondition(conditionData: ConditionData, context: Record<string, any>): boolean {
  if (!conditionData || !Array.isArray(conditionData.rules) || conditionData.rules.length === 0) {
    return true; // No conditions set means rule matches by default
  }

  const { rules, logicalOperator = 'AND' } = conditionData;

  const results = rules.map((rule) => {
    const rawFieldValue = getNestedProperty(context, rule.field);
    const targetVal = rule.value;

    switch (rule.operator) {
      case 'equals':
        return String(rawFieldValue ?? '').toLowerCase() === String(targetVal ?? '').toLowerCase();
      
      case 'not_equals':
        return String(rawFieldValue ?? '').toLowerCase() !== String(targetVal ?? '').toLowerCase();
      
      case 'greater_than':
        return Number(rawFieldValue ?? 0) > Number(targetVal ?? 0);
      
      case 'less_than':
        return Number(rawFieldValue ?? 0) < Number(targetVal ?? 0);
      
      case 'contains':
        return String(rawFieldValue ?? '')
          .toLowerCase()
          .includes(String(targetVal ?? '').toLowerCase());
      
      case 'starts_with':
        return String(rawFieldValue ?? '')
          .toLowerCase()
          .startsWith(String(targetVal ?? '').toLowerCase());
      
      case 'is_empty':
        return rawFieldValue === null || rawFieldValue === undefined || String(rawFieldValue).trim() === '';
      
      case 'is_not_empty':
        return rawFieldValue !== null && rawFieldValue !== undefined && String(rawFieldValue).trim() !== '';
      
      default:
        return false;
    }
  });

  return logicalOperator === 'AND' ? results.every(Boolean) : results.some(Boolean);
}

/**
 * Replaces merge tags like "{{deal.title}}" or "{{amount}}" with dynamic values from context
 */
export function resolveMergeTags(templateStr: string, context: Record<string, any>): string {
  if (!templateStr || typeof templateStr !== 'string') return '';

  return templateStr.replace(/\{\{([\w.]+)\}\}/g, (match, path) => {
    const value = getNestedProperty(context, path);
    return value !== undefined && value !== null ? String(value) : match;
  });
}
