import { Router } from "express";
import {
  createBlog,
  deleteBlog,
  getBlogById,
  getBlogByUrlTitle,
  getBlogs,
  updateBlog,
} from "../controllers/blog.controller";

export const blogRouter = Router();

blogRouter.get("/", getBlogs);
blogRouter.get("/getbyid/:id", getBlogById);
blogRouter.get("/:urlTitle", getBlogByUrlTitle);
blogRouter.post("/", createBlog);
blogRouter.put("/:id", updateBlog);
blogRouter.delete("/:id", deleteBlog);
