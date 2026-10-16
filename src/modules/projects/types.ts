export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type IssueType = 'task' | 'bug' | 'feature' | 'improvement' | 'epic';

export interface TaskStatusColumn {
  id: string;
  name: string;
  color?: string;
  order: number;
}

export interface Subtask {
  id: string;
  taskId?: string;
  title: string;
  completed: boolean;
}

export interface TaskComment {
  id: string;
  authorId?: string;
  authorName: string;
  authorEmail?: string;
  content: string;
  createdAt: string;
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  size?: number;
  uploadedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: string; // references TaskStatusColumn.id (e.g. 'todo', 'in_progress', etc.)
  priority: TaskPriority;
  issueType?: IssueType;
  progress?: number;
  dueDate?: string;
  startDate?: string;
  
  // Ownership & People
  assigneeId?: string;
  assignee?: {
    id: string;
    displayName: string;
    email: string;
    photoURL?: string;
  };
  creatorId?: string;
  creator?: {
    id: string;
    displayName: string;
    email: string;
  };

  // Scheduling & Time Tracking
  estimatedHours?: number;
  actualHours?: number;

  // Hierarchies & Milestones
  parentTaskId?: string;
  milestoneId?: string;
  subtasks?: Subtask[];

  // Collaboration & Extensibility
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
  tags?: string[];
  customFields?: Record<string, any>;

  createdAt?: string;
  updatedAt?: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: 'pending' | 'in_progress' | 'completed';
  completionPercentage?: number;
  tasksCount?: number;
  completedTasksCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectWorkspaceMeta {
  id: string;
  title: string;
  description?: string;
  ownerId?: string;
  owner?: {
    id: string;
    displayName: string;
    email: string;
  };
  members?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_COLUMNS: TaskStatusColumn[] = [
  { id: 'backlog', name: 'Backlog', color: 'slate', order: 0 },
  { id: 'todo', name: 'To Do', color: 'blue', order: 1 },
  { id: 'in_progress', name: 'In Progress', color: 'amber', order: 2 },
  { id: 'review', name: 'In Review', color: 'purple', order: 3 },
  { id: 'done', name: 'Done', color: 'emerald', order: 4 },
];
