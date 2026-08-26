/**
 * REST CRM Entity Record Synchronization Hook
 * Provides optimistic state updates and Express REST API integration
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../../../services/api';
import { BaseCRMEntity, EntityModuleName } from '../../../types/crmEntities';

export interface UseEntityRecordResult<T extends BaseCRMEntity = BaseCRMEntity> {
  record: T | null;
  loading: boolean;
  error: Error | null;
  updateField: (fieldName: string, newValue: any) => Promise<boolean>;
  reload: () => void;
}

export function useEntityRecord<T extends BaseCRMEntity = BaseCRMEntity>(
  module: EntityModuleName,
  recordId: string | undefined
): UseEntityRecordResult<T> {
  const [record, setRecord] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Store the last committed snapshot for error rollback
  const previousRecordRef = useRef<T | null>(null);

  const fetchRecord = useCallback(async () => {
    if (!recordId) {
      setRecord(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await apiClient.get<T>(`/crm/${module}/${recordId}`);
      setRecord(data || null);
      previousRecordRef.current = data || null;
    } catch (err: any) {
      console.error(`[useEntityRecord] Error fetching ${module}/${recordId}:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [module, recordId]);

  useEffect(() => {
    fetchRecord();
  }, [fetchRecord]);

  /**
   * Optimistic Field Update
   * Updates local state immediately, then writes to REST API with rollback on failure.
   */
  const updateField = useCallback(
    async (fieldName: string, newValue: any): Promise<boolean> => {
      if (!recordId || !record) return false;

      const previousState = record;
      previousRecordRef.current = previousState;

      // 1. Optimistic local state update
      let updatedEntity: T;
      if (fieldName.startsWith('customFields.')) {
        const customKey = fieldName.replace('customFields.', '');
        updatedEntity = {
          ...record,
          customFields: {
            ...(record.customFields || {}),
            [customKey]: newValue,
          },
        };
      } else {
        updatedEntity = {
          ...record,
          [fieldName]: newValue,
        };
      }

      setRecord(updatedEntity);

      // 2. Persist to REST API
      try {
        const payload = fieldName.startsWith('customFields.')
          ? { customFields: (updatedEntity as any).customFields }
          : { [fieldName]: newValue };

        await apiClient.put(`/crm/${module}/${recordId}`, payload);
        return true;
      } catch (err: any) {
        console.error(`[useEntityRecord] Update failed, rolling back:`, err);
        setRecord(previousState);
        setError(err);
        return false;
      }
    },
    [module, recordId, record]
  );

  const reload = useCallback(() => {
    fetchRecord();
  }, [fetchRecord]);

  return {
    record,
    loading,
    error,
    updateField,
    reload,
  };
}

export default useEntityRecord;
