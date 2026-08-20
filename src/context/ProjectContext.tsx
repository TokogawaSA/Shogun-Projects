import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Project } from '../types';

export interface ProjectContextType {
  currentProjectId: string | null;
  setCurrentProjectId: (id: string | null) => void;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

export const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

interface ProjectProviderProps {
  children: ReactNode;
  initialProjectId?: string | null;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ 
  children, 
  initialProjectId = 'proj-shogun-1' 
}) => {
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(initialProjectId);
  const [projects, setProjects] = useState<Project[]>([
    {
      id: 'proj-shogun-1',
      title: 'Antigravity 2.0 Integration Hub',
      description: 'Centralized multi-agent orchestration and task tracking for Shogun Projects.',
      organizationId: 'org-shogunate-root',
      ownerId: 'usr-admin-master',
      members: ['usr-admin-master', 'usr-dev-agent-1'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  return (
    <ProjectContext.Provider
      value={{
        currentProjectId,
        setCurrentProjectId,
        projects,
        setProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

export default ProjectContext;
