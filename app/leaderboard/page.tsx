'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { usersAPI, ProjectEntry } from '@/lib/api';
import Navbar from '@/components/Navbar';

export default function LeaderboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchLeaderboard();
    }
  }, [user]);

  const fetchLeaderboard = async () => {
    try {
      const data = await usersAPI.getLeaderboard();
      setProjects(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch leaderboard');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <>
        <Navbar />
        <div className="container">
          <p>Loading...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <h1 style={{ marginBottom: '2rem' }}>Project Leaderboard</h1>
        <p style={{ marginBottom: '2rem', color: '#666' }}>
          Each entry represents a project.
        </p>

        {error && <div className="error">{error}</div>}

        {projects.length === 0 ? (
          <div className="card">
            <p>No data available yet.</p>
          </div>
        ) : (
          <div>
            {projects.map((project, index) => (
              <div key={project._id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                  <h2>{index < 3 ? (index === 0 ? '🥇 ' : index === 1 ? '🥈 ' : '🥉 ') : ''}{project.title}</h2>
                  <span style={{ color: '#666' }}>{new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
                <div style={{ marginBottom: '0.5rem', color: '#666' }}>Idea: {project.projectIdea}</div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Team:</strong>{' '}
                  {project.users.map((u, i) => (
                    <span key={i}>
                      {u.name} ({u.email}){i < project.users.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>
                {project.githubRepoLink && (
                  <p>
                    <strong>GitHub Repo:</strong>{' '}
                    <a href={project.githubRepoLink} target="_blank" rel="noopener noreferrer" style={{ color: '#0070f3' }}>
                      {project.githubRepoLink}
                    </a>
                  </p>
                )}
                {project.demoLink && (
                  <p>
                    <strong>Demo Link:</strong>{' '}
                    <a href={project.demoLink} target="_blank" rel="noopener noreferrer" style={{ color: '#0070f3' }}>
                      {project.demoLink}
                    </a>
                  </p>
                )}
                <p style={{ color: '#666', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  Created by: {project.createdBy.name} ({project.createdBy.email})
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}


