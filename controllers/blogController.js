// import { connection } from "mongoose";
import mongoose from "mongoose";
import Blog from "../models/blogModel.js";

// Get all blog posts
export const getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({});
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching blogs", error });
  }
};

// Get a single blog post by ID
export const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (blog) {
      res.json(blog);
    } else {
      res.status(404).json({ message: "Blog not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching blog", error });
  }
};

export const getBlogByLink = async (req, res) => {
  try {
    let link = req.params.id;
    const blog = await Blog.findOne({ link });
    if (blog) {
      res.json(blog);
    } else {
      res.status(404).json({ message: "Blog not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching blog", error });
  }
};

// Create a new blog post
export const createBlog = async (req, res) => {
  try {
    const { title, content, type, image, link } = req.body;
    const blog = new Blog({ title, content, type, image, link });

    const createdBlog = await blog.save();
    res.status(201).json(createdBlog);
  } catch (error) {
    res.status(500).json({ message: "Error creating blog", error });
  }
};

// Update a blog post
export const updateBlog = async (req, res) => {
  try {
    const { title, content, type, image, link } = req.body;

    const blog = await Blog.findById(req.params.id);
    if (blog) {
      blog.title = title;
      blog.image = image;
      blog.content = content;
      blog.type = type;
      blog.link = link;

      const updatedBlog = await blog.save();
      res.json(updatedBlog);
    } else {
      res.status(404).json({ message: "Blog not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error updating blog", error });
  }
};

// Delete a blog post

export const deleteBlog = async (req, res) => {
  console.log("Request parameters:", req.params);

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid blog ID format" });
  }

  try {
    const blog = await Blog.findById(req.params.id);
    if (blog) {
      await blog.deleteOne(); // Use deleteOne instead of remove
      res.json({ message: "Blog deleted" });
    } else {
      res.status(404).json({ message: "Blog not found" });
    }
  } catch (error) {
    console.error("Error in deleteBlog:", error);
    res.status(500).json({ message: "Error deleting blog", error });
  }
};
