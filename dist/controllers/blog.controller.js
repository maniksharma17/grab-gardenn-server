"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBlog = exports.updateBlog = exports.createBlog = exports.getBlogByUrlTitle = exports.getBlogById = exports.getBlogs = void 0;
const blog_model_1 = require("../models/blog.model");
const getBlogs = async (req, res) => {
    try {
        const blogs = await blog_model_1.Blog.find().sort({ createdAt: -1 });
        res.status(200).json(blogs);
    }
    catch (error) {
        console.error("Error fetching blogs:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.getBlogs = getBlogs;
const getBlogById = async (req, res) => {
    const { id } = req.params;
    try {
        const blog = await blog_model_1.Blog.findById(id);
        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }
        res.status(200).json(blog);
    }
    catch (error) {
        console.error("Error fetching blog by ID:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.getBlogById = getBlogById;
const getBlogByUrlTitle = async (req, res) => {
    const { urlTitle } = req.params;
    try {
        const blog = await blog_model_1.Blog.findOne({ urlTitle });
        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }
        res.status(200).json(blog);
    }
    catch (error) {
        console.error("Error fetching blog by URL title:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.getBlogByUrlTitle = getBlogByUrlTitle;
const createBlog = async (req, res) => {
    const { title, urlTitle, content, coverImage, tags } = req.body;
    try {
        const newBlog = new blog_model_1.Blog({
            title,
            urlTitle,
            content,
            coverImage,
            tags
        });
        await newBlog.save();
        res.status(201).json(newBlog);
    }
    catch (error) {
        console.error("Error creating blog:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.createBlog = createBlog;
const updateBlog = async (req, res) => {
    const { id } = req.params;
    const { title, content, coverImage, tags, urlTitle } = req.body;
    try {
        const updatedBlog = await blog_model_1.Blog.findOneAndUpdate({ _id: id }, { title, content, coverImage, tags, urlTitle }, { new: true });
        if (!updatedBlog) {
            return res.status(404).json({ message: "Blog not found" });
        }
        res.status(200).json(updatedBlog);
    }
    catch (error) {
        console.error("Error updating blog:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.updateBlog = updateBlog;
const deleteBlog = async (req, res) => {
    const { id } = req.params;
    try {
        const deletedBlog = await blog_model_1.Blog.findByIdAndDelete(id);
        if (!deletedBlog) {
            return res.status(404).json({ message: "Blog not found" });
        }
        res.status(200).json({ message: "Blog deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting blog:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.deleteBlog = deleteBlog;
