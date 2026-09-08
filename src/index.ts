import { Hono } from "hono";
import { logger } from "hono/logger";
import { getCollection } from "astro:content";

const app = new Hono();

app.use(logger());

app.get("/", async (ctx) => {
  const entries = await getCollection("index");
  const allPackages = entries.flatMap((entry) => entry.data.packages);
  const count = new Set(allPackages.map((pkg) => pkg.name)).size;
  const lastPackage = allPackages.length > 0
    ? allPackages.reduce((a, b) =>
      a.published_at > b.published_at ? a : b,
    )
    : null;
  return ctx.json({ last_package: lastPackage, count });
});

app.get("/:path{[^/]+/.+}", async (ctx) => {
  const rawPath = ctx.req.param("path");
  const entries = await getCollection("index");

  const versionIdx = rawPath.lastIndexOf("/");
  const maybeVersion = rawPath.slice(versionIdx + 1);
  const parentPath = rawPath.slice(0, versionIdx);

  const entry = entries.find((e) => e.id === parentPath);
  if (entry) {
    const pkg = entry.data.packages.find((p) => p.version === maybeVersion);
    if (pkg) {
      return ctx.json(pkg);
    }
  }

  const exactEntry = entries.find((e) => e.id === rawPath);
  if (exactEntry) {
    return ctx.json(exactEntry.data.packages);
  }

  return ctx.json({ error: "not found", path: rawPath }, 404);
});

export default app;