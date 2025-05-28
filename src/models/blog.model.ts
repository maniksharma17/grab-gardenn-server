import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    urlTitle: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    coverImage: { type: String, required: true },
    tags: [String],
  },
  { timestamps: true }
);

export const Blog = mongoose.model('Blog', blogSchema);