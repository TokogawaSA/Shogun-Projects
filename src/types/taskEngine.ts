/**
 * ClickUp-Style Task & Subtask Configurable Engine Domain Contracts
 */

export type CustomFieldType =
  | 'text'
  | 'number'
  | 'picklist'
  | 'date'
  | 'currency'
  | 'rating'
  | 'checkbox'
  | 'user'
  | 'progress';

export interface CustomFieldOption {
  id: string;
  label: string;
  colorHex: string;
}

export interface CustomFieldDefinition {
  id: string;
  name: string;
  type: CustomFieldType;
  description?: string;
  isRequired?: boolean;
  options?: CustomFieldOption[]; // for picklist
  currencySymbol?: string; // for currency (e.g. '$', '€', '£')
  ratingMax?: number; // default 5
  defaultValue?: any;
}

export interface CustomFieldValue {
  fieldId: string;
  fieldName: string;
  type: CustomFieldType;
  value: any;
}

export type DependencyRelationType = 'waiting_on' | 'blocking' | 'related';

export interface TaskDependencyItem {
  id: string;
  taskId: string;
  targetTaskId: string;
  targetTaskTitle: string;
  targetTaskStatus: string;
  type: DependencyRelationType;
  createdAt: string;
}

export type RecurrenceTriggerType = 'on_schedule' | 'on_completion';
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom_cron';

export interface AdvancedRecurrenceConfig {
  enabled: boolean;
  triggerType: RecurrenceTriggerType;
  frequency: RecurrenceFrequency;
  interval: number; // e.g. every 2 weeks
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, etc.
  dayOfMonth?: number;
  endCondition: 'never' | 'after_count' | 'on_date';
  occurrenceCount?: number;
  endDate?: string;
  createNewTaskOnRecur: boolean; // true = new clone task, false = reset status to todo
}

export interface TaskAssigneeAllocation {
  userId: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role?: string;
  allocationPercent?: number; // default 100
}
