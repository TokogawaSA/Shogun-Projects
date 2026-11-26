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
  initialProjectId = null
}) => {
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(initialProjectId);
  const [projects, setProjects] = useState<Project[]>([]);

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
