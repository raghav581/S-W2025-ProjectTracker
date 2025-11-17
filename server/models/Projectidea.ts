import mongoose, { Schema, Document, Types, models, model } from "mongoose";

export type ProjectLevel = "beginner" | "intermediate";

export interface IProjectIdea extends Document {
  code: number;
  title: string;
  level: ProjectLevel;
  description?: string;
  isTaken: boolean;
  takenBy?: Types.ObjectId | null;
  takenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const projectIdeaSchema = new Schema<IProjectIdea>(
  {
    code: {
      type: Number,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    level: {
      type: String,
      enum: ["beginner", "intermediate"],
      required: true,
    },
    description: {
      type: String,
    },
    isTaken: {
      type: Boolean,
      default: false,
      index: true,
    },
    takenBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    takenAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

projectIdeaSchema.index({ takenBy: 1 }, { unique: true, sparse: true });

const ProjectIdea =
  (models.ProjectIdea as mongoose.Model<IProjectIdea>) ||
  model<IProjectIdea>("ProjectIdea", projectIdeaSchema);

export default ProjectIdea;
