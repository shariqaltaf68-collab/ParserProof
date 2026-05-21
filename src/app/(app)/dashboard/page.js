'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  PlusCircle,
  History,
  FileText,
  ArrowRight,
  TrendingUp,
  BarChart3,
  Zap,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

function SkeletonCard() {
  return (
    <div className="stat-card">
      <div className="skeleton skeleton-text" style={{ width: '60%' }} />
      <div className="skeleton skeleton-title" style={{ width: '40%' }} />
      <div className="skeleton skeleton-text" style={{ width: '80%' }} />
    </div>
  );
}

function SkeletonProjectCard() {
  return (
    <div className="project-card" style={{ pointerEvents: 'none' }}>
      <div className="project-card-info">
        <div className="skeleton skeleton-text" style={{ width: '70%' }} />
        <div className="skeleton skeleton-text" style={{ width: '40%' }} />
      </div>
      <div className="skeleton skeleton-avatar" />
    </div>
  );
}

function getScoreColor(score) {
  if (score >= 70) return 'var(--color-success)';
  if (score >= 40) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

function getScoreBg(score) {
  if (score >= 70) return 'var(--color-success-light)';
  if (score >= 40) return 'var(--color-warning-light)';
  return 'var(--color-danger-light)';
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'completed':
      return 'badge badge-success';
    case 'processing':
      return 'badge badge-warning';
    case 'failed':
      return 'badge badge-danger';
    default:
      return 'badge badge-neutral';
  }
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [projectsRes, statsRes] = await Promise.all([
          fetch('/api/projects?limit=5'),
          fetch('/api/user/stats'),
        ]);

        if (!projectsRes.ok || !statsRes.ok) {
          throw new Error('Failed to load dashboard data');
        }

        const [projectsData, statsData] = await Promise.all([
          projectsRes.json(),
          statsRes.json(),
        ]);

        setProjects(projectsData.projects || []);
        setStats(statsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const userName = session?.user?.name || 'there';
  const userPlan = session?.user?.plan || 'free';
  const firstName = userName.split(' ')[0];

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <BarChart3 size={36} />
        </div>
        <div className="empty-state-title">Unable to load dashboard</div>
        <div className="empty-state-description">{error}</div>
        <button
          id="dashboard-retry"
          className="btn btn-primary"
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <>
      <section className="dashboard-welcome">
        <h2 className="dashboard-welcome-title">
          Welcome back, {firstName}
        </h2>
        <p className="dashboard-welcome-subtitle">
          Optimize your resume and advance your career with AI-powered insights.
        </p>
      </section>

      {loading ? (
        <div className="usage-meter">
          <div className="skeleton skeleton-text" style={{ width: '50%' }} />
          <div
            className="skeleton"
            style={{ height: '8px', width: '100%', marginTop: '12px' }}
          />
        </div>
      ) : stats ? (
        <div className="usage-meter">
          <div className="usage-meter-header">
            <span className="usage-meter-label">AI Generations</span>
            <span className="usage-meter-count">
              <strong>{stats.usage.used}</strong> of {stats.usage.limit} free
              generations used this month
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{
                width: `${Math.min(
                  100,
                  (stats.usage.used / stats.usage.limit) * 100
                )}%`,
                background:
                  stats.usage.remaining <= 1
                    ? 'var(--color-danger)'
                    : stats.usage.remaining <= Math.ceil(stats.usage.limit * 0.2)
                    ? 'var(--color-warning)'
                    : undefined,
              }}
            />
          </div>
          {userPlan === 'free' && stats.usage.remaining <= Math.ceil(stats.usage.limit * 0.2) && (
            <div style={{ marginTop: 'var(--space-3)', textAlign: 'right' }}>
              <Link href="/billing" className="btn btn-sm btn-primary" id="upgrade-link">
                Upgrade
              </Link>
            </div>
          )}
        </div>
      ) : null}

      <div className="dashboard-stats">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-card-label">Total Projects</div>
              <div className="stat-card-value">{stats?.totalProjects ?? 0}</div>
              <div className="stat-card-meta">
                <TrendingUp size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />{' '}
                All time
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Average ATS Score</div>
              <div
                className="stat-card-value"
                style={{
                  color:
                    stats?.averageScore != null
                      ? getScoreColor(stats.averageScore)
                      : undefined,
                }}
              >
                {stats?.averageScore != null
                  ? `${Math.round(stats.averageScore)}%`
                  : '—'}
              </div>
              <div className="stat-card-meta">Across all projects</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">This Month&apos;s Generations</div>
              <div className="stat-card-value">{stats?.usage?.used ?? 0}</div>
              <div className="stat-card-meta">
                {stats?.usage?.remaining ?? 0} remaining
              </div>
            </div>
          </>
        )}
      </div>

      <div className="quick-actions">
        <Link
          href="/new"
          id="quick-action-new-project"
          className="card card-interactive"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-4)',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-accent-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-accent)',
                flexShrink: 0,
              }}
            >
              <PlusCircle size={22} />
            </div>
            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 'var(--font-size-base)',
                  marginBottom: '2px',
                }}
              >
                New Project
              </div>
              <div
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Optimize a resume for a new job posting
              </div>
            </div>
          </div>
        </Link>
        <Link
          href="/history"
          id="quick-action-view-history"
          className="card card-interactive"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-4)',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-success-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-success)',
                flexShrink: 0,
              }}
            >
              <History size={22} />
            </div>
            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 'var(--font-size-base)',
                  marginBottom: '2px',
                }}
              >
                View History
              </div>
              <div
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Review and manage your past projects
              </div>
            </div>
          </div>
        </Link>
      </div>

      <section>
        {loading ? (
          <>
            <div className="recent-projects-header">
              <div className="skeleton skeleton-title" />
            </div>
            <div className="project-list">
              <SkeletonProjectCard />
              <SkeletonProjectCard />
              <SkeletonProjectCard />
            </div>
          </>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FileText size={36} />
            </div>
            <div className="empty-state-title">No projects yet</div>
            <div className="empty-state-description">
              Create your first project to start optimizing your resume.
            </div>
            <Link href="/new" className="btn btn-primary" id="empty-state-new-project">
              <PlusCircle size={16} />
              Create Project
            </Link>
          </div>
        ) : (
          <>
            <div className="recent-projects-header">
              <h3 className="recent-projects-title">Recent Projects</h3>
              <Link href="/history" className="btn btn-ghost btn-sm" id="view-all-projects">
                View All
                <ArrowRight size={14} />
              </Link>
            </div>
            <div className="project-list">
              {projects.map((project) => {
                const title =
                  project.jobTitle && project.company
                    ? `${project.jobTitle} @ ${project.company}`
                    : project.title || 'Untitled Project';

                return (
                  <Link
                    key={project.id}
                    href={`/results/${project.id}`}
                    className="project-card"
                    id={`project-card-${project.id}`}
                  >
                    <div className="project-card-info">
                      <div className="project-card-title">{title}</div>
                      <div className="project-card-meta">
                        <span>{formatRelativeTime(project.createdAt)}</span>
                        <span className={getStatusBadgeClass(project.status)}>
                          {project.status}
                        </span>
                      </div>
                    </div>
                    {project.atsScore != null && (
                      <div
                        className="project-card-score"
                        style={{
                          color: getScoreColor(project.atsScore),
                          background: getScoreBg(project.atsScore),
                        }}
                      >
                        {project.atsScore}
                      </div>
                    )}
                    <ArrowRight
                      size={16}
                      style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }}
                    />
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </section>
    </>
  );
}
