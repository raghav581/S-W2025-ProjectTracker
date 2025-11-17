import mongoose, { Schema, Document, Types } from "mongoose";

interface IUserDetail {
  name: string;
  email: string;
  githubUsername: string;
}

export interface IProjectEntry extends Document {
  title: string;
  teamKey: string;
  users: IUserDetail[];
  projectIdea: Types.ObjectId;
  githubRepoLink: string;
  demoLink: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const userDetailSchema = new Schema<IUserDetail>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    githubUsername: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const projectEntrySchema = new Schema<IProjectEntry>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    // Unique team key derived from sorted user emails to prevent duplicate teams
    teamKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    users: {
      type: [userDetailSchema],
      required: true,
      validate: {
        validator: function (v) {
          return v.length === 3;
        },
        message: "Exactly 3 users are required",
      },
    },
    projectIdea: {
      type: Schema.Types.ObjectId,
      ref: "ProjectIdea",
      required: true,
      unique: true,
    },
    githubRepoLink: {
      type: String,
      default: "",
      trim: true,
    },
    demoLink: {
      type: String,
      default: "",
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure uniqueness of emails and github usernames within a project
projectEntrySchema.pre("validate", function (next) {
  if (Array.isArray(this.users)) {
    const emails = this.users.map((u) => (u.email || "").toLowerCase().trim());
    const githubs = this.users.map((u) =>
      (u.githubUsername || "").toLowerCase().trim()
    );
    const uniqueEmails = new Set(emails);
    const uniqueGithubs = new Set(githubs);
    if (uniqueEmails.size !== emails.length) {
      return next(new Error("User emails in a project must be unique"));
    }
    if (uniqueGithubs.size !== githubs.length) {
      return next(new Error("GitHub usernames in a project must be unique"));
    }
    // Compute deterministic team key to enforce uniqueness across projects
    this.teamKey = emails.sort().join("|");
  }
  next();
});

export default mongoose.models.ProjectEntry ||
  mongoose.model<IProjectEntry>("ProjectEntry", projectEntrySchema);
