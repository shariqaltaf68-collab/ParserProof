'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { History, Search, Trash2, Eye, Plus, AlertTriangle, Loader2 } from 'lucide-react';

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getScoreColor(score) {
  if (score >= 80) return 'var(--color-success)';
  if (score >= 60) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'completed':
      return 'badge badge-success';
    case 'processing':
      return 'badge badge-accent';
    default:
      return 'badge badge-neutral';
  }
}

function SkeletonCard() {
  return (
    <div className="project-card">
      <div className="project-card-info">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-text" style={{ width: '40%' }} />
      </div>
      <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '50%' }} />
    </div>
  );
}

export default function HistoryPage() {
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch('/api/projects');
        if (res.ok) {
          const data = await res.json();
          setProjects(data.projects || data);
        }
      } catch {
        // Silently handle — empty state will show
      } finally {
        setIsLoading(false);
      }
    }
    fetchProjects();
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/projects/${deleteId}`, { method: 'DELETE' });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== deleteId));
      }
    } catch {
      // Keep the project in the list on failure
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  }, [deleteId]);

  const filteredProjects = projects.filter((project) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      (project.title && project.title.toLowerCase().includes(query)) ||
      (project.jobTitle && project.jobTitle.toLowerCase().includes(query)) ||
      (project.company && project.company.toLowerCase().includes(query))
    );
  });

  return (
    <div className="page-content">
      <div className="history-header">
        <h1>Project History</h1>
        <div className="history-filters">
          <div className="search-input">
            <Search size={18} className="search-input-icon" />
            <input
              id="history-search"
              type="text"
              className="form-input"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="project-list">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filteredProjects.length === 0 && projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <History size={36} />
          </div>
          <h2 className="empty-state-title">No projects yet</h2>
          <p className="empty-state-description">
            Your optimized resumes will appear here.
          </p>
          <Link href="/new" className="btn btn-primary" id="history-new-project">
            <Plus size={18} />
            New Project
          </Link>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Search size={36} />
          </div>
          <h2 className="empty-state-title">No results found</h2>
          <p className="empty-state-description">
            No projects match &ldquo;{searchQuery}&rdquo;. Try a different search term.
          </p>
        </div>
      ) : (
        <div className="project-list">
          {filteredProjects.map((project) => (
            <div key={project.id} className="project-card">
              <Link
                href={`/results/${project.id}`}
                className="project-card-info"
                id={`project-link-${project.id}`}
              >
                <div className="project-card-title">
                  {project.title || project.jobTitle || 'Untitled Project'}
                </div>
                <div className="project-card-meta">
                  <span>{formatDate(project.createdAt)}</span>
                  {project.company && <span>{project.company}</span>}
                  <span
                    className={getStatusBadgeClass(project.status)}
                  >
                    {project.status || 'draft'}
                  </span>
                </div>
              </Link>

              {project.atsScore != null && (
                <div
                  className="project-card-score"
                  style={{
                    background: `${getScoreColor(project.atsScore)}20`,
                    color: getScoreColor(project.atsScore),
                  }}
                >
                  {project.atsScore}
                </div>
              )}

              <div className="project-card-actions">
                <Link
                  href={`/results/${project.id}`}
                  className="btn btn-ghost btn-sm"
                  id={`view-project-${project.id}`}
                >
                  <Eye size={16} />
                  View
                </Link>
                <button
                  type="button"
                  className="btn btn-ghost btn-icon btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteId(project.id);
                  }}
                  id={`delete-project-${project.id}`}
                  aria-label="Delete project"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={() => !isDeleting && setDeleteId(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
          >
            <div className="modal-header">
              <h2 className="modal-title" id="delete-modal-title">Delete this project?</h2>
            </div>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              This action cannot be undone. The project and all its data will be permanently deleted.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
                id="delete-modal-cancel"
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={isDeleting}
                id="delete-modal-confirm"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={16} className="loader-spinner" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
