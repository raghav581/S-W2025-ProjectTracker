import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import {
  verifyAuth,
  verifyAdminAuth,
  sendError,
  sendSuccess,
} from "@/lib/authMiddleware";
import ProjectEntry from "@/server/models/ProjectEntry";
import AllowedEmail from "@/server/models/AllowedEmail";
import ProjectIdea from "@/server/models/Projectidea";
import { allowedEmailsAPI } from "@/lib/api";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (id) {
    return handleGetProject(req, id);
  }

  return handleGetAllProjects(req);
}

async function handleGetAllProjects(req: NextRequest) {
  try {
    await dbConnect();
    const { user, error } = await verifyAuth(req);

    if (error || !user) {
      return sendError(error || "Unauthorized", 401);
    }

    let projects;

    // Admin can see all projects
    if (user.role === "admin" || user.role === "superadmin") {
      projects = await ProjectEntry.find()
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 });
    } else {
      // Regular users can only see projects where their email is in the users array
      projects = await ProjectEntry.find({
        "users.email": user.email.toLowerCase(),
      })
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 });
    }

    return sendSuccess(projects);
  } catch (error) {
    console.error("Get projects error:", error);
    return sendError("Server error fetching projects", 500);
  }
}

async function handleGetProject(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const { user, error } = await verifyAuth(req);

    if (error || !user) {
      return sendError(error || "Unauthorized", 401);
    }

    const project = await ProjectEntry.findById(id).populate(
      "createdBy",
      "name email"
    );

    if (!project) {
      return sendError("Project not found", 404);
    }

    // Check permissions
    const userEmail = user.email.toLowerCase();
    const isUserInProject = project.users.some(
      (u: any) => u.email.toLowerCase() === userEmail
    );
    const isAdmin = user.role === "admin" || user.role === "superadmin";

    if (!isUserInProject && !isAdmin) {
      return sendError("Access denied", 403);
    }

    return sendSuccess(project);
  } catch (error) {
    console.error("Get project error:", error);
    return sendError("Server error fetching project", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { user, error } = await verifyAuth(req);

    if (error || !user) {
      return sendError(error || "Unauthorized", 401);
    }

    const { title, users, projectIdea, githubRepoLink, demoLink } =
      await req.json();

    if (!title) {
      return sendError("Title is required", 400);
    }
    if (!users || !Array.isArray(users) || users.length !== 3) {
      return sendError("Exactly 3 users are required", 400);
    }

    const emails = users.map((u: any) => (u.email || "").toLowerCase());

    const existingProject = await ProjectEntry.findOne({
      "users.email": { $in: emails },
    });

    if (existingProject) {
      // Optional: build a nice error message listing conflicting emails
      const existingEmails = existingProject.users.map((u: any) =>
        (u.email || "").toLowerCase()
      );
      const conflictingEmails = emails.filter((e) =>
        existingEmails.includes(e)
      );

      return sendError(
        `These emails are already part of another project: ${conflictingEmails.join(
          ", "
        )}`,
        400
      );
    }

    if (!projectIdea) {
      return sendError("Project idea is required", 400);
    }

    // Validate user details
    for (const u of users) {
      if (!u.name || !u.email || !u.githubUsername) {
        return sendError(
          "Each user must have name, email, and githubUsername",
          400
        );
      }
    }

    // Enforce allowlist for any @adypu.edu.in emails in team
    const adypuEmails = users
      .map((u: any) => (u.email || "").toLowerCase())
      .filter((e: string) => e.endsWith("@adypu.edu.in"));

    console.log("Check it :", adypuEmails);

    if (adypuEmails.length > 0) {
      const allowed = await AllowedEmail.find({
        email: { $in: adypuEmails },
      }).lean();

      console.log("Check it after :", allowed);
      const allowedSet = new Set(allowed.map((a: any) => a.email));
      const notAllowed = adypuEmails.filter((e: string) => !allowedSet.has(e));
      if (notAllowed.length > 0) {
        return sendError(
          `These emails are not allowed: ${notAllowed.join(", ")}`,
          403
        );
      }
    }

    // One of the three emails must match the logged-in user (non-admin requirement)
    const requesterEmail = user.email.toLowerCase();
    const includesRequester = emails.includes(requesterEmail);
    const isAdmin = user.role === "admin" || user.role === "superadmin";

    if (!isAdmin && !includesRequester) {
      return sendError(
        "Your email must be included as one of the 3 users",
        403
      );
    }

    // Local uniqueness check within payload
    const uniqueEmails = new Set(emails);
    const uniqueGithubs = new Set(
      users.map((u: any) => (u.githubUsername || "").toLowerCase())
    );

    if (uniqueEmails.size !== emails.length) {
      return sendError("User emails in a team must be unique", 400);
    }
    if (uniqueGithubs.size !== users.length) {
      return sendError("GitHub usernames in a team must be unique", 400);
    }

    const projectEntry = new ProjectEntry({
      title,
      users,
      projectIdea,
      githubRepoLink: githubRepoLink || "",
      demoLink: demoLink || "",
      createdBy: user._id,
    });

    try {
      await projectEntry.save();
    } catch (error: any) {
      if (error?.code === 11000 && error?.message?.includes("projectIdea")) {
        return sendError(
          "This project idea is already taken by another team",
          400
        );
      }
      if (error?.code === 11000 || error?.message?.includes("duplicate key")) {
        return sendError(
          "A project with the same team members already exists",
          400
        );
      }
      console.error("Create project error:", error);
      return sendError("Server error creating project entry", 500);
    }

    await ProjectIdea.findOneAndUpdate(
      { _id: projectIdea },
      {
        isTaken: true,
        takenBy: projectEntry._id,
        takenAt: new Date(),
      }
    );

    await projectEntry.populate("createdBy", "name email");

    return sendSuccess(projectEntry, 201);
  } catch (error: any) {
    console.error("Create project error:", error);
    if (error?.code === 11000 || error?.message?.includes("duplicate key")) {
      return sendError(
        "A project with the same team members already exists",
        400
      );
    }
    return sendError("Server error creating project entry", 500);
  }
}

export async function PUT(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return sendError("Project ID is required", 400);
  }

  return handleUpdateProject(req, id);
}

async function handleUpdateProject(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const { user, error } = await verifyAuth(req);

    if (error || !user) {
      return sendError(error || "Unauthorized", 401);
    }

    const project = await ProjectEntry.findById(id);

    if (!project) {
      return sendError("Project not found", 404);
    }

    // Check permissions
    const userEmail = user.email.toLowerCase();
    const isUserInProject = project.users.some(
      (u: any) => u.email.toLowerCase() === userEmail
    );
    const isAdmin = user.role === "admin" || user.role === "superadmin";

    if (!isUserInProject && !isAdmin) {
      return sendError(
        "You can only edit projects where your email is included",
        403
      );
    }

    const { title, users, projectIdea, githubRepoLink, demoLink } =
      await req.json();

    if (title) {
      project.title = title;
    }

    if (users && Array.isArray(users) && users.length === 3) {
      // Enforce inclusion rule for non-admin updaters
      const emails = users.map((u: any) => (u.email || "").toLowerCase());
      const includesRequester = emails.includes(userEmail);

      if (!isAdmin && !includesRequester) {
        return sendError(
          "Your email must be included as one of the 3 users",
          403
        );
      }

      // Local uniqueness within payload
      const uniqueEmails = new Set(emails);
      const uniqueGithubs = new Set(
        users.map((u: any) => (u.githubUsername || "").toLowerCase())
      );

      if (uniqueEmails.size !== emails.length) {
        return sendError("User emails in a team must be unique", 400);
      }
      if (uniqueGithubs.size !== users.length) {
        return sendError("GitHub usernames in a team must be unique", 400);
      }

      // Allowlist enforcement for @adypu.edu.in on update
      const adypuEmailsUpdate = emails.filter((e: string) =>
        e.endsWith("@adypu.edu.in")
      );
      console.log(allowedEmailsAPI);

      if (adypuEmailsUpdate.length > 0) {
        const allowed = await AllowedEmail.find({
          email: { $in: adypuEmailsUpdate },
        }).lean();
        const allowedSet = new Set(allowed.map((a: any) => a.email));
        const notAllowed = adypuEmailsUpdate.filter(
          (e: string) => !allowedSet.has(e)
        );
        if (notAllowed.length > 0) {
          return sendError(
            `These emails are not allowed: ${notAllowed.join(", ")}`,
            403
          );
        }
      }

      project.users = users;
    }

    if (projectIdea) {
      const currentIdeaId = project.projectIdea
        ? project.projectIdea.toString()
        : null;
      const newIdeaId = projectIdea.toString();

      if (currentIdeaId !== newIdeaId) {
        if (currentIdeaId) {
          await ProjectIdea.findByIdAndUpdate(currentIdeaId, {
            isTaken: false,
            takenBy: null,
            takenAt: null,
          });
        }

        const claimedIdea = await ProjectIdea.findOneAndUpdate(
          { _id: newIdeaId, isTaken: false },
          {
            isTaken: true,
            takenBy: project._id, 
            takenAt: new Date(),
          },
          { new: true }
        );

        if (!claimedIdea) {
          return sendError(
            "Selected project idea is invalid or already taken by another team",
            400
          );
        }

        project.projectIdea = claimedIdea._id;
      }
    }

    if (githubRepoLink !== undefined) {
      project.githubRepoLink = githubRepoLink;
    }

    if (demoLink !== undefined) {
      project.demoLink = demoLink;
    }

    await project.save();
    await project.populate("createdBy", "name email");

    return sendSuccess(project);
  } catch (error: any) {
    console.error("Update project error:", error);
    if (error?.code === 11000 || error?.message?.includes("duplicate key")) {
      return sendError(
        "A project with the same team members already exists",
        400
      );
    }
    return sendError("Server error updating project", 500);
  }
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return sendError("Project ID is required", 400);
  }

  return handleDeleteProject(req, id);
}

async function handleDeleteProject(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const { user, error } = await verifyAdminAuth(req);

    if (error || !user) {
      return sendError(error || "Unauthorized", 401);
    }

    const project = await ProjectEntry.findById(id);

    if (!project) {
      return sendError("Project not found", 404);
    }

    if (project.projectIdea) {
      await ProjectIdea.findByIdAndUpdate(project.projectIdea, {
        isTaken: false,
        takenBy: null,
        takenAt: null,
      });
    }

    await ProjectEntry.findByIdAndDelete(id);

    return sendSuccess({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Delete project error:", error);
    return sendError("Server error deleting project", 500);
  }
}
