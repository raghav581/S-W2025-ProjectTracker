// app/api/project-ideas/route.ts
import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { verifyAuth, sendError, sendSuccess } from "@/lib/authMiddleware";
import ProjectIdea from "@/server/models/Projectidea";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const includeTaken = url.searchParams.get("includeTaken");

  if (id) {
    return handleGetIdea(req, id);
  }

  return handleGetAllIdeas(req, includeTaken === "true");
}

async function handleGetAllIdeas(req: NextRequest, includeTaken: boolean) {
  try {
    await dbConnect();
    const { user, error } = await verifyAuth(req);

    if (error || !user) {
      return sendError(error || "Unauthorized", 401);
    }

    const filter: Record<string, any> = {};
    if (!includeTaken) {
      filter.isTaken = false;
    }

    const ideas = await ProjectIdea.find(filter).sort({ code: 1 });

    return sendSuccess(ideas);
  } catch (err) {
    console.error("Get project ideas error:", err);
    return sendError("Server error fetching project ideas", 500);
  }
}

async function handleGetIdea(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const { user, error } = await verifyAuth(req);

    if (error || !user) {
      return sendError(error || "Unauthorized", 401);
    }

    const idea = await ProjectIdea.findById(id);

    if (!idea) {
      return sendError("Project idea not found", 404);
    }

    return sendSuccess(idea);
  } catch (err) {
    console.error("Get project idea error:", err);
    return sendError("Server error fetching project idea", 500);
  }
}
