import express from "express";
import {
  getBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  getBlogByLink,
} from "../controllers/blogController.js";

const router = express.Router();

// Get all blog posts
router.get("/", getBlogs);

// Get a single blog post by ID
router.get("/:id", getBlogById);

router.get("/link/:id", getBlogByLink);

// Create a new blog post
router.post("/", createBlog);

// Update a blog post
router.put("/:id", updateBlog);

// Delete a blog post
router.delete("/:id", deleteBlog);

export default router;
