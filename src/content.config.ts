import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { readdir, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import type { Loader } from "astro/loaders";
import { fileURLToPath } from "node:url";

const rootPath = fileURLToPath(new URL("../", import.meta.url));

const packageSchema = z.object({
  name: z.string(),
  version: z.string(),
  published_at: z.coerce.date(),
});

const indexLoader: Loader = {
  name: "index-files",
  async load({ store, logger }) {
    store.clear();

    const indexDir = path.join(rootPath, "index");
    let root: string;

    try {
      root = await realpath(indexDir);
    } catch {
      logger.warn(`Directory not found: ${indexDir}`);
      return;
    }

    async function visit(directory: string): Promise<void> {
      const entries = await readdir(directory, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.name.startsWith(".") || entry.name.endsWith("~")) continue;

        const filePath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
          await visit(filePath);
          continue;
        }
        if (!entry.isFile()) continue;

        const resolvedPath = await realpath(filePath);
        const relativePath = path.relative(root, resolvedPath);
        if (
          relativePath.startsWith(`..${path.sep}`) ||
          path.isAbsolute(relativePath)
        ) {
          logger.warn(`Skipping file outside index/: ${filePath}`);
          continue;
        }

        const id = relativePath
          .split(path.sep)
          .join("/")
          .replace(/\.json$/, "");

        const content = await readFile(resolvedPath, "utf8");
        const packages = packageSchema.array().parse(JSON.parse(content));

        store.set({ id, data: { packages } });
      }
    }

    await visit(root);
  },
};

const index = defineCollection({
  loader: indexLoader,
  schema: z.object({ packages: packageSchema.array() }),
});

export const collections = { index };