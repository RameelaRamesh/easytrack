import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api/client';
import { FolderKanban, X, Save } from 'lucide-react';
import { Project } from '../../types';

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Edit fields
  const [editStatus, setEditStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchProjects = async () => {
    try {
      const res = await apiClient.get<Project[]>('/projects/');
      setProjects(res.data || []);
    } catch (err) {
      console.error(err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setEditStatus(project.status);
    setMsg('');
  };

  const handleSaveProject = async () => {
    if (!selectedProject) return;
    setSaving(true);
    setMsg('');
    try {
      await apiClient.patch(`/projects/${selectedProject.id}/`, {
        status: editStatus
      });
      setMsg('Project status updated successfully!');
      fetchProjects();
      setSelectedProject(prev => prev ? { ...prev, status: editStatus as 'active' | 'inactive' } : null);
    } catch (err) {
      console.error(err);
      setMsg('Failed to update status. Custom data saved locally.');
      setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, status: editStatus as 'active' | 'inactive' } : p));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm p-6 space-y-6 text-slate-800 dark:text-slate-100">
      
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
          <FolderKanban className="h-5 w-5 mr-2 text-brand-primary" />
          Projects Workspace
        </h2>
        <p className="text-sm text-slate-500 mt-1">Operational projects and client delivery campaigns.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => handleSelectProject(project)}
              className="p-5 border border-gray-150 dark:border-slate-750 bg-gray-50/50 dark:bg-slate-900 rounded-xl space-y-3 cursor-pointer hover:shadow-md transition duration-150 hover:border-brand-primary"
            >
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">{project.name}</h3>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${
                  project.status === 'active' 
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900' 
                    : 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-400 border-gray-200 dark:border-slate-700'
                }`}>
                  {project.status}
                </span>
              </div>
              <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">{project.description || 'No description provided.'}</p>
              <div className="border-t border-gray-100 dark:border-slate-800 pt-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Client Association: <span className="text-slate-700 dark:text-slate-200">{project.client_name}</span>
              </div>
            </div>
          ))}
          {projects.length === 0 && (
            <p className="text-slate-400 col-span-2 text-center py-6">No projects found.</p>
          )}
        </div>
      )}

      {/* Project details & edit modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-gray-150 dark:border-slate-750 p-4 sm:p-5 shrink-0">
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">Project Details</h3>
              <button onClick={() => setSelectedProject(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              {msg && (
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-455 border border-emerald-250 text-xs font-bold rounded-lg">
                  {msg}
                </div>
              )}

              <div>
                <p className="text-[10px] uppercase font-bold text-slate-455">Project Name</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{selectedProject.name}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-455">Description</p>
                <p className="text-slate-700 dark:text-slate-350 leading-relaxed mt-0.5">{selectedProject.description || 'No description provided.'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-455">Client Account Association</p>
                <p className="font-semibold text-slate-850 dark:text-white mt-0.5">{selectedProject.client_name}</p>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-455 mb-1">Project Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="p-4 border-t border-gray-150 dark:border-slate-750 shrink-0 flex justify-end gap-2 bg-slate-50 dark:bg-slate-850">
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 rounded-lg text-slate-650 text-xs font-semibold"
              >
                Close
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveProject}
                className="flex items-center px-4 py-1.5 bg-brand-primary bg-brand-primary-hover text-white rounded-lg text-xs font-bold shadow-xs"
              >
                <Save className="h-3.5 w-3.5 mr-1" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default ProjectsPage;
