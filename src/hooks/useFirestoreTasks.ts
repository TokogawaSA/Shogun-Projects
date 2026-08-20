import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  FirestoreError,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { Task } from '../types';

export interface UseFirestoreTasksResult {
  tasks: Task[];
  loading: boolean;
  error: Error | null;
}

export const useFirestoreTasks = (projectId: string | undefined): UseFirestoreTasksResult => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!projectId) {
      setTasks([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const tasksRef = collection(db, 'projects', projectId, 'tasks');
    const tasksQuery = query(tasksRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      tasksQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const fetchedTasks: Task[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            projectId: data.projectId || projectId,
            title: data.title || '',
            description: data.description || '',
            status: data.status || 'todo',
            priority: data.priority || 'medium',
            assigneeId: data.assigneeId,
            creatorId: data.creatorId || '',
            dueDate: data.dueDate,
            createdAt: typeof data.createdAt === 'object' && data.createdAt?.toDate 
              ? data.createdAt.toDate().toISOString() 
              : String(data.createdAt || new Date().toISOString()),
            updatedAt: typeof data.updatedAt === 'object' && data.updatedAt?.toDate 
              ? data.updatedAt.toDate().toISOString() 
              : String(data.updatedAt || new Date().toISOString()),
            category: data.category,
            assignedAgent: data.assignedAgent,
            progress: data.progress,
            subtasks: data.subtasks || [],
            optimistic: false,
          } as Task;
        });

        setTasks(fetchedTasks);
        setLoading(false);
      },
      (err: FirestoreError) => {
        console.error(`Firestore snapshot error for project ${projectId}:`, err);
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [projectId]);

  return { tasks, loading, error };
};

export default useFirestoreTasks;
