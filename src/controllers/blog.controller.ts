import { Request, Response } from "express";
import { Blog } from "../models/blog.model";
import { idText } from "typescript";

export const getBlogs = async (req: Request, res: Response) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.status(200).json(blogs);
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const getBlogById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    res.status(200).json(blog);
  } catch (error) {
    console.error("Error fetching blog by ID:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const getBlogByUrlTitle = async (req: Request, res: Response) => {
  const { urlTitle } = req.params;
  try {
    const blog = await Blog.findOne({ urlTitle });
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    res.status(200).json(blog);
  } catch (error) {
    console.error("Error fetching blog by URL title:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const createBlog = async (req: Request, res: Response) => {
  const { title, urlTitle, content, coverImage, tags } = req.body;
  try {
    const newBlog = new Blog({
      title,
      urlTitle,
      content,
      coverImage,
      tags
    });
    await newBlog.save();
    res.status(201).json(newBlog);
  } catch (error) {
    console.error("Error creating blog:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const updateBlog = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, content, coverImage, tags, urlTitle } = req.body;
  try {
    const updatedBlog = await Blog.findOneAndUpdate(
      { _id: id },
      { title, content, coverImage, tags, urlTitle },
      { new: true }
    );
    if (!updatedBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    res.status(200).json(updatedBlog);
  } catch (error) {
    console.error("Error updating blog:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const deleteBlog = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const deletedBlog = await Blog.findByIdAndDelete(id);
    if (!deletedBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    res.status(200).json({ message: "Blog deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}