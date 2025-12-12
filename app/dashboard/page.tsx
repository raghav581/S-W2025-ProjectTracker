"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/authClient";
import { useRouter } from "next/navigation";
import { ObjectId } from "mongoose";
import {
  projectsAPI,
  projectIdeasAPI,
  ProjectEntry,
  ProjectIdea,
  UserDetail,
} from "@/lib/api";
import Navbar from "@/components/Navbar";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [projects, setProjects] = useState<ProjectEntry[]>([]);
  const [projectIdeas, setProjectIdeas] = useState<ProjectIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectEntry | null>(
    null
  );
  const [formData, setFormData] = useState({
    title: "",
    users: [
      { name: "", email: "", githubUsername: "" },
      { name: "", email: "", githubUsername: "" },
      { name: "", email: "", githubUsername: "" },
    ] as UserDetail[],
    projectIdea: "",
    githubRepoLink: "",
    demoLink: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchProjects();
      fetchProjectIdeas();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      const data = await projectsAPI.getAll();
      setProjects(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectIdeas = async () => {
    try {
      const data = await projectIdeasAPI.getAll(true); // Include taken ideas for editing
      console.log("Check : ", data);

      setProjectIdeas(data);
    } catch (err) {
      console.error("Error fetching project ideas:", err);
      // Not blocking: we still allow form, just without ideas
    }
  };

  const handleUserChange = (
    index: number,
    field: keyof UserDetail,
    value: string
  ) => {
    const newUsers = [...formData.users];
    newUsers[index] = { ...newUsers[index], [field]: value };
    setFormData({ ...formData, users: newUsers });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      if (editingProject) {
        await projectsAPI.update(editingProject._id, formData);
        setSuccess("Project updated successfully!");
      } else {
        await projectsAPI.create(formData);
        setSuccess("Project created successfully!");
      }
      setShowForm(false);
      setEditingProject(null);
      setFormData({
        title: "",
        users: [
          { name: "", email: "", githubUsername: "" },
          { name: "", email: "", githubUsername: "" },
          { name: "", email: "", githubUsername: "" },
        ],
        projectIdea: "",
        githubRepoLink: "",
        demoLink: "",
      });
      fetchProjects();
    } catch (err: any) {
      setError(err.message || "Failed to save project");
    }
  };

  const handleEdit = (project: ProjectEntry) => {
    setEditingProject(project);
    // Handle projectIdea as either an object (from API) or a string (ID)
    const projectIdeaId = typeof project.projectIdea === 'object' && project.projectIdea !== null
      ? String((project.projectIdea as any)._id)
      : String(project.projectIdea);
    setFormData({
      title: project.title,
      users: project.users,
      projectIdea: projectIdeaId,
      githubRepoLink: project.githubRepoLink,
      demoLink: project.demoLink,
    });
    setShowForm(true);
  };

  const canEdit = (project: ProjectEntry) => {
    if (!user) return false;
    if (user.role === "admin" || user.role === "superadmin") return true;
    return project.users.some(
      (u) => u.email.toLowerCase() === user.email.toLowerCase()
    );
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
  console.log(projectIdeas, formData)
  
  return (
    <>
      <Navbar />
      <div className="container">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
          }}
        >
          <h1>My Projects</h1>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingProject(null);
            }}
            className="btn btn-primary"
          >
            Create New Project
          </button>
        </div>

        {showForm && (
          <div className="card">
            <h2>{editingProject ? "Edit Project" : "Create New Project"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Project Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>

              <h3 style={{ marginBottom: "1rem" }}>
                User Details (3 users required)
              </h3>
              {formData.users.map((userDetail, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: "1.5rem",
                    padding: "1rem",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                  }}
                >
                  <h4>User {index + 1}</h4>
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      value={userDetail.name}
                      onChange={(e) =>
                        handleUserChange(index, "name", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={userDetail.email}
                      onChange={(e) =>
                        handleUserChange(index, "email", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>GitHub Username</label>
                    <input
                      type="text"
                      value={userDetail.githubUsername}
                      onChange={(e) =>
                        handleUserChange(
                          index,
                          "githubUsername",
                          e.target.value
                        )
                      }
                      required
                    />
                  </div>
                </div>
              ))}

              <div className="form-group">
                <label>Project Idea</label>
                <select
                  value={formData.projectIdea}
                  onChange={(e) =>
                    setFormData({ ...formData, projectIdea: e.target.value })
                  }
                  required
                >
                  <option value="">Select a project idea</option>
                  {projectIdeas.map((idea) => (
                    <option key={idea._id} value={String(idea._id)}>
                      {idea.code}. {idea.title} ({idea.level})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>GitHub Repo Link</label>
                <input
                  type="url"
                  value={formData.githubRepoLink}
                  onChange={(e) =>
                    setFormData({ ...formData, githubRepoLink: e.target.value })
                  }
                  placeholder="https://github.com/username/repo"
                />
              </div>

              <div className="form-group">
                <label>Demo Link</label>
                <input
                  type="url"
                  value={formData.demoLink}
                  onChange={(e) =>
                    setFormData({ ...formData, demoLink: e.target.value })
                  }
                  placeholder="https://your-demo-link.com"
                />
              </div>

              {error && <div className="error">{error}</div>}
              {success && <div className="success">{success}</div>}

              <div style={{ display: "flex", gap: "1rem" }}>
                <button type="submit" className="btn btn-primary">
                  {editingProject ? "Update Project" : "Create Project"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingProject(null);
                    setFormData({
                      title: "",
                      users: [
                        { name: "", email: "", githubUsername: "" },
                        { name: "", email: "", githubUsername: "" },
                        { name: "", email: "", githubUsername: "" },
                      ],
                      projectIdea: "",
                      githubRepoLink: "",
                      demoLink: "",
                    });
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {projects.length === 0 ? (
          <div className="card">
            <p>No projects found. Create your first project!</p>
          </div>
        ) : (
          <div>
            {projects.map((project) => (
              <div key={project._id} className="card">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                    marginBottom: "1rem",
                  }}
                >
                  <div>
                    <h2>{project.title}</h2>
                    <div style={{ color: "#666", marginTop: "0.25rem" }}>
                      Idea: {typeof project.projectIdea === 'object' && project.projectIdea
                        ? `${(project.projectIdea as any).code}. ${(project.projectIdea as any).title}`
                        : project.projectIdea}
                    </div>
                  </div>
                  {canEdit(project) && (
                    <button
                      onClick={() => handleEdit(project)}
                      className="btn btn-secondary"
                    >
                      Edit
                    </button>
                  )}
                </div>
                <div style={{ marginBottom: "1rem" }}>
                  <h3>Team Members:</h3>
                  <ul style={{ marginLeft: "1.5rem" }}>
                    {project.users.map((u, idx) => (
                      <li key={idx}>
                        <strong>{u.name}</strong> - {u.email} (GitHub:{" "}
                        {u.githubUsername})
                      </li>
                    ))}
                  </ul>
                </div>
                {project.githubRepoLink && (
                  <p>
                    <strong>GitHub Repo:</strong>{" "}
                    <a
                      href={project.githubRepoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#0070f3" }}
                    >
                      {project.githubRepoLink}
                    </a>
                  </p>
                )}
                {project.demoLink && (
                  <p>
                    <strong>Demo Link:</strong>{" "}
                    <a
                      href={project.demoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#0070f3" }}
                    >
                      {project.demoLink}
                    </a>
                  </p>
                )}
                <p
                  style={{
                    color: "#666",
                    fontSize: "0.875rem",
                    marginTop: "1rem",
                  }}
                >
                  Created: {new Date(project.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
