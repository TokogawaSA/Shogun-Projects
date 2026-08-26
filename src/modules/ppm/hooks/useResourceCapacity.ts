import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { ResourceProfile, SkillMatrix, Task, Project } from '../../../types';

export interface WorkloadTaskDetail {
  taskId: string;
  projectId: string;
  projectTitle: string;
  taskTitle: string;
  estimatedHours: number;
  status: string;
  dueDate?: string;
  priority: string;
  category?: string;
}

export interface WorkloadSummary {
  userId: string;
  displayName: string;
  email: string;
  photoURL?: string;
  department: string;
  weeklyCapacityHours: number;
  hourlyCostRate: number;
  hourlyBillingRate: number;
  skills: string[];
  assignedHours: number;
  utilizationPercent: number;
  isOverallocated: boolean;
  status: 'optimal' | 'near_capacity' | 'over_allocated';
  tasks: WorkloadTaskDetail[];
}

export interface UseResourceCapacityReturn {
  profiles: ResourceProfile[];
  workloads: Record<string, WorkloadSummary>;
  skills: SkillMatrix[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  saveProfile: (profile: ResourceProfile) => Promise<void>;
  saveSkill: (skill: SkillMatrix) => Promise<void>;
  deleteSkill: (skillId: string) => Promise<void>;
}

const DEFAULT_SKILLS: SkillMatrix[] = [
  { skillId: 'sk-react', name: 'React 19 & TypeScript', category: 'Frontend' },
  { skillId: 'sk-tailwind', name: 'Tailwind CSS & UI Design', category: 'Frontend' },
  { skillId: 'sk-node', name: 'Node.js & Express', category: 'Backend' },
  { skillId: 'sk-python', name: 'Python & AI Pipelines', category: 'Backend' },
  { skillId: 'sk-mysql', name: 'MySQL & Relational Schema', category: 'DevOps' },
  { skillId: 'sk-gcp', name: 'Google Cloud Platform & BigQuery', category: 'Data Architecture' },
  { skillId: 'sk-security', name: 'Security & Nonce Verification', category: 'Security & QA' },
  { skillId: 'sk-ppm', name: 'Agile & Portfolio Governance', category: 'Product Management' },
];

export const useResourceCapacity = (): UseResourceCapacityReturn => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<ResourceProfile[]>([]);
  const [workloads, setWorkloads] = useState<Record<string, WorkloadSummary>>({});
  const [skills, setSkills] = useState<SkillMatrix[]>(DEFAULT_SKILLS);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCapacityData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [profilesData, tasksData, projectsData] = await Promise.all([
        apiClient.get<ResourceProfile[]>('/ppm/resources').catch(() => []),
        apiClient.get<Task[]>('/projects/tasks/all').catch(() => []),
        apiClient.get<Project[]>('/projects').catch(() => []),
      ]);

      const loadedProfiles = profilesData && profilesData.length > 0
        ? profilesData
        : [
            {
              userId: user?.uid || 'usr-admin-master',
              tenantId: user?.tenantId || 'tenant-default',
              department: 'Core Engineering',
              skills: ['sk-react', 'sk-node', 'sk-mysql', 'sk-ppm'],
              weeklyCapacityHours: 40,
              hourlyCostRate: 85,
              hourlyBillingRate: 175,
              globalWorkloadHours: {},
            },
          ];

      setProfiles(loadedProfiles);

      const projectTitleMap = new Map<string, string>();
      (projectsData || []).forEach((p) => projectTitleMap.set(p.id, p.title));

      const newWorkloads: Record<string, WorkloadSummary> = {};

      loadedProfiles.forEach((p) => {
        newWorkloads[p.userId] = {
          userId: p.userId,
          displayName: user?.uid === p.userId ? (user?.displayName || 'User') : 'Developer',
          email: user?.uid === p.userId ? user?.email : `${p.userId}@shogunate.io`,
          department: p.department || 'Engineering',
          weeklyCapacityHours: p.weeklyCapacityHours || 40,
          hourlyCostRate: p.hourlyCostRate || 85,
          hourlyBillingRate: p.hourlyBillingRate || 175,
          skills: p.skills || [],
          assignedHours: 0,
          utilizationPercent: 0,
          isOverallocated: false,
          status: 'optimal',
          tasks: [],
        };
      });

      (tasksData || []).forEach((t) => {
        if (!t.assigneeId) return;
        const entry = newWorkloads[t.assigneeId];
        if (entry) {
          const est = Number(t.estimatedHours) || 0;
          entry.assignedHours += est;
          entry.tasks.push({
            taskId: t.id,
            projectId: t.projectId,
            projectTitle: projectTitleMap.get(t.projectId) || 'Active Project',
            taskTitle: t.title,
            estimatedHours: est,
            status: t.status,
            dueDate: t.dueDate,
            priority: t.priority,
            category: t.category,
          });
        }
      });

      Object.values(newWorkloads).forEach((w) => {
        const util = w.weeklyCapacityHours > 0 ? (w.assignedHours / w.weeklyCapacityHours) * 100 : 0;
        w.utilizationPercent = Math.round(util);
        w.isOverallocated = w.assignedHours > w.weeklyCapacityHours;
        w.status = w.assignedHours > w.weeklyCapacityHours ? 'over_allocated' : util >= 80 ? 'near_capacity' : 'optimal';
      });

      setWorkloads(newWorkloads);
    } catch (err: any) {
      console.warn('[useResourceCapacity] Error fetching capacity:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCapacityData();
  }, [fetchCapacityData]);

  const saveProfile = async (profile: ResourceProfile): Promise<void> => {
    await apiClient.post('/ppm/resources', profile);
    await fetchCapacityData();
  };

  const saveSkill = async (skill: SkillMatrix): Promise<void> => {
    setSkills((prev) => {
      const idx = prev.findIndex((s) => s.skillId === skill.skillId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = skill;
        return copy;
      }
      return [...prev, skill];
    });
  };

  const deleteSkill = async (skillId: string): Promise<void> => {
    setSkills((prev) => prev.filter((s) => s.skillId !== skillId));
  };

  return {
    profiles,
    workloads,
    skills,
    loading,
    error,
    refresh: fetchCapacityData,
    saveProfile,
    saveSkill,
    deleteSkill,
  };
};

export default useResourceCapacity;
