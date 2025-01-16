import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { sign } from "hono/jwt";
import { signinUser, signupUser } from "@avinashsuthar/meduim";

const userRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
}>();

userRouter.post("/signup", async (c) => {
  try {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const body = await c.req.json();
    const { success } = signupUser.safeParse(body);
    if (!success) {
      c.status(411);
      return c.json({
        msg: "inputs are invalid",
      });
    }
    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        password: body.password,
      },
    });

    const token = await sign({ id: user.id }, c.env.JWT_SECRET, "HS256");

    return c.json({ jwt: token });
  } catch (error) {
    c.status(403);
    return c.json({
      msg: "Error",
    });
  }
});

userRouter.post("/signin", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  });
  const body = await c.req.json();
  const { success } = signinUser.safeParse(body);
  if (!success) {
    c.status(411);
    return c.json({
      msg: "inputs are invalid",
    });
  }
  try {
    const user = await prisma.user.findFirst({
      where: {
        email: body.email,
        password: body.password,
      },
    });
    if (!user) {
      c.status(403);

      return c.json({
        msg: "invalid creds",
      });
    }
    const token = await sign({ id: user.id }, c.env.JWT_SECRET, "HS256");
    return c.json({
      jwt: token,
    });
  } catch (error) {
    console.log(error);
    c.status(500);
    return c.json({
      msg: "invalid creds",
    });
  }
});

export default userRouter;
