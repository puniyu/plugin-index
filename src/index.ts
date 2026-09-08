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

app.get("/:path/:name/:version?", async (ctx) => {
  const path = ctx.req.param("path");
  const name = ctx.req.param("name");
  const version = ctx.req.param("version");
  const id = `${path}/${name}`;
  const entries = await getCollection("index");
  const entryMap = new Map(entries.map((e) => [e.id, e]));

  const entry = entryMap.get(id);
  if (!entry) {
    return ctx.json({ error: "not found", path: id }, 404);
  }

  if (version) {
    const pkg = entry.data.packages.find((p) => p.version === version);
    if (pkg) {
      return ctx.json(pkg);
    }
    return ctx.json({ error: "not found", path: `${id}/${version}` }, 404);
  }

  return ctx.json(entry.data.packages);
});

export default app;