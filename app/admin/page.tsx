'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { projectsAPI, ProjectEntry, UserDetail, usersAPI, User } from '@/lib/api';
import Navbar from '@/components/Navbar';

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<ProjectEntry | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    users: [
      { name: '', email: '', githubUsername: '' },
      { name: '', email: '', githubUsername: '' },
      { name: '', email: '', githubUsername: '' },
    ] as UserDetail[],
    projectIdea: '',
    githubRepoLink: '',
    demoLink: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'admin' && user.role !== 'superadmin') {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'superadmin')) {
      fetchProjects();
      fetchUsers();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      const data = await projectsAPI.getAll();
      setProjects(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await usersAPI.getAll();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
    }
  };

  const handleChangeRole = async (targetUser: User, role: 'user' | 'admin') => {
    try {
      await usersAPI.updateRole(targetUser.id || (targetUser as any)._id, role);
      setSuccess('Role updated successfully');
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to update role');
    }
  };

  const handleUserChange = (index: number, field: keyof UserDetail, value: string) => {
    const newUsers = [...formData.users];
    newUsers[index] = { ...newUsers[index], [field]: value };
    setFormData({ ...formData, users: newUsers });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingProject) {
        await projectsAPI.update(editingProject._id, formData);
        setSuccess('Project updated successfully!');
        setEditingProject(null);
        fetchProjects();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update project');
    }
  };

  const handleEdit = (project: ProjectEntry) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      users: project.users,
      projectIdea: project.projectIdea,
      githubRepoLink: project.githubRepoLink,
      demoLink: project.demoLink,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await projectsAPI.delete(id);
      setSuccess('Project deleted successfully!');
      fetchProjects();
    } catch (err: any) {
      setError(err.message || 'Failed to delete project');
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
        <h1 style={{ marginBottom: '2rem' }}>Admin Dashboard</h1>
        <p style={{ marginBottom: '2rem', color: '#666' }}>
          You have full control to view and edit all project entries.
        </p>

        {(user?.role === 'superadmin') && (
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>Users Management</h2>
            <p style={{ marginBottom: '1rem', color: '#666' }}>
              View all users and change roles (SuperAdmin only).
            </p>
            {users.length === 0 ? (
              <p>No users found.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id || (u as any)._id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.role}</td>
                      <td>
                        {u.role === 'superadmin' ? (
                          <span style={{ color: '#666' }}>No actions</span>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {u.role !== 'admin' && (
                              <button
                                className="btn btn-secondary"
                                onClick={() => handleChangeRole(u, 'admin')}
                              >
                                Make Admin
                              </button>
                            )}
                            {u.role !== 'user' && (
                              <button
                                className="btn btn-danger"
                                onClick={() => handleChangeRole(u, 'user')}
                              >
                                Make User
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {editingProject && (
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h2>Edit Project</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Project Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <h3 style={{ marginBottom: '1rem' }}>User Details</h3>
              {formData.users.map((user, index) => (
                <div key={index} style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '6px' }}>
                  <h4>User {index + 1}</h4>
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      value={user.name}
                      onChange={(e) => handleUserChange(index, 'name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={user.email}
                      onChange={(e) => handleUserChange(index, 'email', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>GitHub Username</label>
                    <input
                      type="text"
                      value={user.githubUsername}
                      onChange={(e) => handleUserChange(index, 'githubUsername', e.target.value)}
                      required
                    />
                  </div>
                </div>
              ))}

              <div className="form-group">
                <label>Project Idea</label>
                <textarea
                  value={formData.projectIdea}
                  onChange={(e) => setFormData({ ...formData, projectIdea: e.target.value })}
                  required
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label>GitHub Repo Link</label>
                <input
                  type="url"
                  value={formData.githubRepoLink}
                  onChange={(e) => setFormData({ ...formData, githubRepoLink: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Demo Link</label>
                <input
                  type="url"
                  value={formData.demoLink}
                  onChange={(e) => setFormData({ ...formData, demoLink: e.target.value })}
                />
              </div>

              {error && <div className="error">{error}</div>}
              {success && <div className="success">{success}</div>}

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary">
                  Update Project
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <h2 style={{ marginBottom: '1rem' }}>All Projects ({projects.length})</h2>

        {projects.length === 0 ? (
          <div className="card">
            <p>No projects found.</p>
          </div>
        ) : (
          <div>
            {projects.map((project) => (
              <div key={project._id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div>
                    <h2>{project.title}</h2>
                    <div style={{ color: '#666', marginTop: '0.25rem' }}>Idea: {project.projectIdea}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleEdit(project)} className="btn btn-secondary">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(project._id)} className="btn btn-danger">
                      Delete
                    </button>
                  </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <h3>Team Members:</h3>
                  <ul style={{ marginLeft: '1.5rem' }}>
                    {project.users.map((user, idx) => (
                      <li key={idx}>
                        <strong>{user.name}</strong> - {user.email} (GitHub: {user.githubUsername})
                      </li>
                    ))}
                  </ul>
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
                <p style={{ color: '#666', fontSize: '0.875rem', marginTop: '1rem' }}>
                  Created by: {project.createdBy.name} ({project.createdBy.email}) on {new Date(project.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}


