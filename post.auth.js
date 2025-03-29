import prisma from "../lib/prisma.js";
import jwt from "jsonwebtoken";

export const getPosts = async (req, res) => {
  const query = req.query;
  try {
    const posts = await prisma.post.findMany({
      where: {
        city: query.city || undefined,
        type: query.type || undefined,
        property: query.property || undefined,
        bedroom: query.bedroom ? parseInt(query.bedroom) : undefined,
        price: {
          gte: query.minPrice ? parseInt(query.minPrice) : 0,
          lte: query.maxPrice ? parseInt(query.maxPrice) : 10000000000000,
        },
      },
    });
    res.status(200).json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const getPost = async (req, res) => {
  const id = req.params.id;
  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        postDetail: true,
        user: {
          select: { username: true, avatar: true },
        },
      },
    });

    const token = req.cookies?.token;
    let userId = null;
    let saved = false;

    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        userId = payload.id;

        const savedPost = await prisma.savedPost.findUnique({
          where: {
            userId_postId: {
              userId,
              postId: id,
            },
          },
        });
        saved = !!savedPost;
      } catch (error) {
        console.error("Token verification failed:", error.message);
      }
    }
    
    res.status(200).json({ ...post, isSaved: saved });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const addPost = async (req, res) => {
  const { title, price, address, city, bedroom, bathroom, type, property, images, postDetail } = req.body;
  const tokenUserId = req.userId;

  try {
    if (!title || !price || !address || !city || !property) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newPost = await prisma.post.create({
      data: {
        title,
        price: parseInt(price),
        address,
        city,
        bedroom: bedroom ? parseInt(bedroom) : null,
        bathroom: bathroom ? parseInt(bathroom) : null,
        type,
        property,
        images,
        userId: tokenUserId,
        postDetail: postDetail ? { create: postDetail } : undefined,
      },
    });
    res.status(201).json(newPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const updatePost = async (req, res) => {
  const id = req.params.id;
  const updates = req.body;
  try {
    const updatedPost = await prisma.post.update({
      where: { id },
      data: updates,
    });
    res.status(200).json(updatedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const deletePost = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;

  try {
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (post.userId !== tokenUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await prisma.post.delete({ where: { id } });
    res.status(200).json({ message: "Post successfully deleted!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
