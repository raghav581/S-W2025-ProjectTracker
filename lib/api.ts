const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'superadmin';
}

export interface UserDetail {
  name: string;
  email: string;
  githubUsername: string;
}

export interface ProjectEntry {
  _id: string;
  title: string;
  users: UserDetail[];
  projectIdea: string;
  githubRepoLink: string;
  demoLink: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AllowedEmail {
  _id: string;
  urn: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();
  // Use a concrete type to avoid indexing issues with HeadersInit union
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'An error occurred' }));
    throw new Error(error.error || 'An error occurred');
  }

  return response.json();
};

// Auth API
export const authAPI = {
  signup: async (name: string, email: string, password: string) => {
    return apiCall('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },

  login: async (email: string, password: string) => {
    return apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  verify: async () => {
    return apiCall('/api/auth/verify');
  },
};

// Projects API
export const projectsAPI = {
  getAll: async (): Promise<ProjectEntry[]> => {
    return apiCall('/api/projects');
  },

  getOne: async (id: string): Promise<ProjectEntry> => {
    return apiCall(`/api/projects/${id}`);
  },

  create: async (data: {
    title: string;
    users: UserDetail[];
    projectIdea: string;
    githubRepoLink?: string;
    demoLink?: string;
  }): Promise<ProjectEntry> => {
    return apiCall('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: {
    title?: string;
    users?: UserDetail[];
    projectIdea?: string;
    githubRepoLink?: string;
    demoLink?: string;
  }): Promise<ProjectEntry> => {
    return apiCall(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiCall(`/api/projects/${id}`, {
      method: 'DELETE',
    });
  },
};

// Users API
export const usersAPI = {
  getMe: async (): Promise<{ user: User }> => {
    return apiCall('/api/users/me');
  },

  getAll: async (): Promise<User[]> => {
    return apiCall('/api/users');
  },

  getLeaderboard: async (): Promise<ProjectEntry[]> => {
    return apiCall('/api/users/leaderboard');
  },

  updateRole: async (userId: string, role: 'user' | 'admin') => {
    return apiCall(`/api/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  deleteUser: async (userId: string) => {
    return apiCall(`/api/users/${userId}`, {
      method: 'DELETE',
    });
  },

  deleteUsersBulk: async (ids: string[]) => {
    return apiCall('/api/users', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    });
  },
};

// Allowed Emails API
export const allowedEmailsAPI = {
  getAll: async (): Promise<AllowedEmail[]> => {
    return apiCall('/api/allowed-emails');
  },
  add: async (email: string, name: string, urn: string): Promise<AllowedEmail> => {
    return apiCall('/api/allowed-emails', {
      method: 'POST',
      body: JSON.stringify({ email, name, urn }),
    });
  },
  removeById: async (id: string) => {
    return apiCall(`/api/allowed-emails?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
  removeByEmail: async (email: string) => {
    return apiCall(`/api/allowed-emails?email=${encodeURIComponent(email)}`, {
      method: 'DELETE',
    });
  },
};


