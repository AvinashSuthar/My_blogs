import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { decode, jwt, sign, verify } from "hono/jwt";
import { sha256 } from "hono/utils/crypto";

const app = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
}>();

app.post("/api/v1/signup", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  const user = await prisma.user.create({
    data: {
      email: body.email,
      password: body.password,
    },
  });

  const token = await sign({ id: user.id }, c.env.JWT_SECRET, "HS256");

  return c.json({ jwt: token });
});
app.get("/", (c) => {
  return c.text("Hello Hono!");
});
app.get("/", (c) => {
  return c.text("Hello Hono!");
});
app.get("/", (c) => {
  return c.text("Hello Hono!");
});
app.get("/", (c) => {
  return c.text("Hello Hono!");
});

export default app;
