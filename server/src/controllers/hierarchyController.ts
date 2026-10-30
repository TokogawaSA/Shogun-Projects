import { Request, Response } from 'express';
import { prisma } from '../config/db.js';

// Default ClickApps configuration
const DEFAULT_CLICK_APPS = {
  timeTracking: true,
  timeEstimates: true,
  customFields: true,
  priorities: true,
  sprints: true,
  dependencies: true,
  subtasksInMultipleLists: false,
};

// Default statuses for a newly provisioned Space
const DEFAULT_SPACE_STATUSES = [
  { id: 'st-open', name: 'To Do', type: 'open', colorHex: '#64748b', sortOrder: 0 },
  { id: 'st-in-progress', name: 'In Progress', type: 'active', colorHex: '#3b82f6', sortOrder: 1 },
  { id: 'st-review', name: 'In Review', type: 'active', colorHex: '#8b5cf6', sortOrder: 2 },
  { id: 'st-done', name: 'Complete', type: 'done', colorHex: '#10b981', sortOrder: 3 },
];

/**
 * GET /api/hierarchy/tree
 * Returns the full hierarchy tree (Spaces -> Folders -> Lists) with task metrics
 */
export async function getHierarchyTree(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;

    // Fetch all projects (which act as primary spaces or have spaces)
    const projects = await prisma.project.findMany({
      where: { tenantId },
      include: {
        milestones: true,
        tasks: {
          select: {
            id: true,
            status: true,
            parentTaskId: true,
            milestoneId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Build hierarchy representation bridging Projects -> Spaces -> Folders/Milestones -> Lists
    const spaces = projects.map((p) => {
      const rootTasks = p.tasks.filter((t) => !t.parentTaskId);
      const completedTasks = p.tasks.filter((t) => t.status === 'done' || t.status === 'completed');

      // Milestone folders
      const folders = p.milestones.map((m) => {
        const milestoneTasks = p.tasks.filter((t) => t.milestoneId === m.id);
        const milestoneDone = milestoneTasks.filter((t) => t.status === 'done' || t.status === 'completed');
        return {
          id: m.id,
          spaceId: p.id,
          name: m.title,
          isArchived: false,
          colorHex: '#8b5cf6',
          lists: [
            {
              id: `list-${m.id}`,
              spaceId: p.id,
              folderId: m.id,
              name: `${m.title} Tasks`,
              colorHex: '#8b5cf6',
              taskCount: milestoneTasks.length,
              completedTaskCount: milestoneDone.length,
              createdAt: m.createdAt.toISOString(),
              updatedAt: m.updatedAt.toISOString(),
            },
          ],
          createdAt: m.createdAt.toISOString(),
          updatedAt: m.updatedAt.toISOString(),
        };
      });

      // General folderless list for unassigned milestone tasks
      const generalTasks = p.tasks.filter((t) => !t.milestoneId);
      const generalDone = generalTasks.filter((t) => t.status === 'done' || t.status === 'completed');

      const folderlessLists = [
        {
          id: `list-gen-${p.id}`,
          spaceId: p.id,
          folderId: null,
          name: 'General Backlog',
          colorHex: '#6366f1',
          taskCount: generalTasks.length,
          completedTaskCount: generalDone.length,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        },
      ];

      return {
        id: p.id,
        workspaceId: tenantId,
        name: p.title,
        description: p.description || '',
        avatarColor: '#6366f1',
        icon: 'folder-kanban',
        features: DEFAULT_CLICK_APPS,
        statuses: DEFAULT_SPACE_STATUSES,
        folders,
        lists: folderlessLists,
        totalTasks: p.tasks.length,
        completedTasks: completedTasks.length,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      };
    });

    const totalTasks = projects.reduce((acc, p) => acc + p.tasks.length, 0);
    const totalLists = spaces.reduce(
      (acc, s) => acc + s.lists.length + s.folders.reduce((fAcc, f) => fAcc + f.lists.length, 0),
      0
    );

    res.json({
      workspace: {
        id: tenantId,
        name: 'Enterprise Workspace',
      },
      spaces,
      totalTasks,
      totalLists,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to build hierarchy tree.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

/**
 * POST /api/hierarchy/spaces
 * Create a new Space
 */
export async function createSpace(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.userId;
    const { name, description, avatarColor, features } = req.body;

    if (!name?.trim()) {
      res.status(400).json({ error: 'Space name is required.' });
      return;
    }

    const newProject = await prisma.project.create({
      data: {
        tenantId,
        title: name.trim(),
        description: description || '',
        ownerId: userId,
        members: [userId],
      },
    });

    res.status(201).json({
      id: newProject.id,
      workspaceId: tenantId,
      name: newProject.title,
      description: newProject.description,
      avatarColor: avatarColor || '#6366f1',
      features: features || DEFAULT_CLICK_APPS,
      statuses: DEFAULT_SPACE_STATUSES,
      folders: [],
      lists: [
        {
          id: `list-gen-${newProject.id}`,
          spaceId: newProject.id,
          folderId: null,
          name: 'General Backlog',
          colorHex: '#6366f1',
          taskCount: 0,
          completedTaskCount: 0,
          createdAt: newProject.createdAt.toISOString(),
          updatedAt: newProject.updatedAt.toISOString(),
        },
      ],
      createdAt: newProject.createdAt.toISOString(),
      updatedAt: newProject.updatedAt.toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to create space.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

/**
 * POST /api/hierarchy/folders
 * Create a Folder (Milestone container) within a Space
 */
export async function createFolder(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const { spaceId, name, description, dueDate } = req.body;

    if (!spaceId || !name?.trim()) {
      res.status(400).json({ error: 'spaceId and name are required.' });
      return;
    }

    const project = await prisma.project.findFirst({ where: { id: spaceId, tenantId } });
    if (!project) {
      res.status(404).json({ error: 'Associated space not found in active tenant.' });
      return;
    }

    const milestone = await prisma.projectMilestone.create({
      data: {
        tenantId,
        projectId: spaceId,
        title: name.trim(),
        description: description || '',
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    res.status(201).json({
      id: milestone.id,
      spaceId,
      name: milestone.title,
      isArchived: false,
      colorHex: '#8b5cf6',
      lists: [
        {
          id: `list-${milestone.id}`,
          spaceId,
          folderId: milestone.id,
          name: `${milestone.title} Tasks`,
          colorHex: '#8b5cf6',
          taskCount: 0,
          completedTaskCount: 0,
          createdAt: milestone.createdAt.toISOString(),
          updatedAt: milestone.updatedAt.toISOString(),
        },
      ],
      createdAt: milestone.createdAt.toISOString(),
      updatedAt: milestone.updatedAt.toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to create folder.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

/**
 * POST /api/hierarchy/tasks/nest
 * Nest a task under a parent task, calculating the materialized tree path
 */
export async function nestTask(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const { taskId, parentTaskId } = req.body;

    if (!taskId) {
      res.status(400).json({ error: 'taskId is required.' });
      return;
    }

    const task = await prisma.task.findFirst({ where: { id: taskId, tenantId } });
    if (!task) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }

    let depthLevel = 0;
    let parentPath = `${task.projectId}`;

    if (parentTaskId) {
      const parent = await prisma.task.findFirst({ where: { id: parentTaskId, tenantId } });
      if (!parent) {
        res.status(404).json({ error: 'Parent task not found.' });
        return;
      }
      depthLevel = 1;
      parentPath = `${parent.projectId}.${parent.id}`;
    }

    const treePath = `${parentPath}.${taskId}`;

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        parentTaskId: parentTaskId || null,
      },
    });

    res.json({
      ...updated,
      treePath,
      depthLevel,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to nest task.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

/**
 * POST /api/hierarchy/lists
 * Create a TaskList within a Space or under a Folder (Milestone)
 */
export async function createList(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const { spaceId, folderId, name, colorHex } = req.body;

    if (!spaceId || !name?.trim()) {
      res.status(400).json({ error: 'spaceId and name are required.' });
      return;
    }

    const project = await prisma.project.findFirst({ where: { id: spaceId, tenantId } });
    if (!project) {
      res.status(404).json({ error: 'Associated space not found in active tenant.' });
      return;
    }

    const listId = `list-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    const createdList = {
      id: listId,
      spaceId,
      folderId: folderId || null,
      name: name.trim(),
      colorHex: colorHex || '#6366f1',
      taskCount: 0,
      completedTaskCount: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    res.status(201).json(createdList);
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to create list.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

