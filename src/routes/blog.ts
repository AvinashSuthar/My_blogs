import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { verify } from "hono/jwt";
import { createBlog, updateBlog } from "@avinashsuthar/meduim";

export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
  };
}>();

// middleware to fetch the user id
blogRouter.use("/*", async (c, next) => {
  try {
    // Retrieve the token from the Authorization header
    const token = c.req.header("authorization")?.replace("Bearer ", "") || "";
    if (!token) {
      return c.json({ message: "You are not logged in" }, 403);
    }

    // Verify the token
    const user = await verify(token, c.env.JWT_SECRET); // Ensure `verify` works as intended
    if (user) {
      // Attach the user ID to the context
      //@ts-ignore
      c.set("userId", user.id);
      await next();
    } else {
      return c.json({ message: "Invalid token" }, 403);
    }
  } catch (error) {
    console.error("Authentication error:", error);
    return c.json({ message: "Authentication failed" }, 403);
  }
});

// creating the blog post
blogRouter.post("/", async (c) => {
  try {
    const id = c.get("userId");
    const body = await c.req.json();
    const { success } = createBlog.safeParse(body);
    if (!success) {
      c.status(411);
      return c.json({
        msg: "inputs are invalid",
      });
    }
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    const blog = await prisma.post.create({
      data: {
        title: body.title,
        published: true,
        content: body.content,
        authorId: id,
      },
    });
    c.status(201);
    return c.json({
      blog: blog,
    });
  } catch (error) {
    console.log(error);
    c.status(500);
    return c.json({ error });
  }
});

// updating the blog post
blogRouter.put("/:id", async (c) => {
  try {
    const id = c.get("userId");

    const body = await c.req.json();
    const { success } = updateBlog.safeParse(body);
    if (!success) {
      c.status(411);
      return c.json({
        msg: "inputs are invalid",
      });
    }
    const blogId = await c.req.param("id");
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    const blog = await prisma.post.update({
      where: {
        authorId: id,
        id: blogId,
      },
      data: {
        title: body.title,
        published: true,
        content: body.content,
        authorId: id,
      },
    });
    return c.json({
      blog: blog,
    });
  } catch (error) {
    // console.log(error);
    c.status(403);
    return c.json({
      msg: "you are not the auther of this blog post",
    });
  }
});

blogRouter.get("/get/:id", async (c) => {
  try {
    const blogId = await c.req.param("id");
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const blog = await prisma.post.findFirst({
      where: {
        id: blogId,
      },
    });
    return c.json({
      blog,
    });
  } catch (error) {
    console.log(error);
    c.status(500);
    return c.json({ error });
  }
});

blogRouter.get("/bulk", async (c) => {
  try {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const blogs = await prisma.post.findMany();
    return c.json({
      blogs,
    });
  } catch (error) {
    console.log(error);
    c.status(500);
    return c.json({ error });
  }
});

export default blogRouter;
