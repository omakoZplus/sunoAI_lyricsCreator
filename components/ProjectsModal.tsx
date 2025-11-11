import React, { useState } from 'react';
import { Project } from '../types';
import { Button } from './Button';
import { Icon } from './Icon';

interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  activeProjectId: string | null;
  onLoadProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onRenameProject: (projectId: string, newTitle: string) => void;
  onNewProject: () => void;
}

export const ProjectsModal: React.FC<ProjectsModalProps> = ({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onLoadProject,
  onDeleteProject,
  onRenameProject,
  onNewProject,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const sortedProjects = [...projects].sort((a, b) => b.lastModified - a.lastModified);

  const handleStartRename = (project: Project) => {
    setEditingId(project.id);
    setEditingTitle(project.title || 'Untitled Song');
  };

  const handleConfirmRename = () => {
    if (editingId && editingTitle.trim()) {
      onRenameProject(editingId, editingTitle.trim());
    }
    setEditingId(null);
    setEditingTitle('');
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirmRename();
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditingTitle('');
    }
  };

  const handleDelete = (projectId: string) => {
    onDeleteProject(projectId);
    setDeletingId(null);
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-gray-800 border border-purple-500 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-purple-300">My Songs</h2>
          <div className="flex items-center gap-4">
             <Button onClick={onNewProject} variant="secondary">
                <Icon name="plus" /> New Song
            </Button>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition" aria-label="Close modal">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto">
            {projects.length === 0 ? (
                <p className="text-gray-400 text-center">No songs yet. Create one!</p>
            ) : (
                <ul className="space-y-3">
                    {sortedProjects.map(project => {
                        const isActive = project.id === activeProjectId;
                        const listItemClasses = isActive
                            ? 'bg-gradient-to-r from-purple-900/60 to-gray-900/50 ring-2 ring-purple-500 shadow-lg'
                            : 'bg-gray-900/50 hover:bg-gray-700/50';

                        return (
                        <li key={project.id} className={`p-3 rounded-lg flex items-center justify-between gap-4 transition-all duration-300 ${listItemClasses}`}>
                            {editingId === project.id ? (
                                <input
                                    type="text"
                                    value={editingTitle}
                                    onChange={(e) => setEditingTitle(e.target.value)}
                                    onBlur={handleConfirmRename}
                                    onKeyDown={handleKeyDown}
                                    autoFocus
                                    className="flex-grow bg-gray-700/80 border border-purple-500 rounded-md px-3 py-1.5 text-white ring-2 ring-purple-500/50 focus:outline-none w-full"
                                />
                            ) : (
                                <div className="flex-grow cursor-pointer overflow-hidden" onClick={() => onLoadProject(project.id)}>
                                    <p className="font-semibold text-white truncate">{project.title || 'Untitled Song'}</p>
                                    <p className="text-sm text-gray-400">Last modified: {new Date(project.lastModified).toLocaleString()}</p>
                                </div>
                            )}

                            <div className="flex-shrink-0 flex items-center gap-2">
                                {deletingId === project.id ? (
                                    <>
                                        <span className="text-xs text-red-300">Delete?</span>
                                        <Button onClick={() => handleDelete(project.id)} className="!py-1 !px-2 text-xs !bg-red-600 hover:!bg-red-700">Confirm</Button>
                                        <Button onClick={() => setDeletingId(null)} variant="secondary" className="!py-1 !px-2 text-xs">Cancel</Button>
                                    </>
                                ) : (
                                    <>
                                        {isActive ? (
                                            <span className="text-xs font-bold text-purple-300 uppercase px-2 py-1 bg-purple-500/20 rounded-full">Active</span>
                                        ) : (
                                            <Button onClick={() => onLoadProject(project.id)} variant="secondary" className="!py-1 !px-2 text-xs">Load</Button>
                                        )}
                                        <button onClick={() => handleStartRename(project)} title="Rename" className="text-gray-400 hover:text-white p-1.5 rounded-md hover:bg-gray-600">
                                            <Icon name="edit" className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => setDeletingId(project.id)} title="Delete" className="text-gray-400 hover:text-red-400 p-1.5 rounded-md hover:bg-red-900/50">
                                            <Icon name="delete" className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </li>
                    )})}
                </ul>
            )}
        </div>
      </div>
    </div>
  );
};