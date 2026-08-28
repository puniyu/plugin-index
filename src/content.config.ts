import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { readdir, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import type { Loader } from "astro/loaders";
import { fileURLToPath } from "node:url";
import type { PackageInfo } from "./types";

const rootPath = fileURLToPath(new URL("../", import.meta.url));

const indexLoader: Loader = {
  name: "index-files",
  async load({ store, parseData, logger }) {
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

        const id = relativePath.split(path.sep).join("/");
        const siteRelativePath = path.relative(rootPath, resolvedPath).split(
          path.sep,
        ).join("/");
        const content = await readFile(resolvedPath, "utf8");
        const packages = JSON.parse(content) as PackageInfo[];
        const latest = packages.reduce((a, b) =>
          a.publish_time > b.publish_time ? a : b,
        );
        const data = await parseData({
          id,
          data: {
            name: latest.name,
            version: latest.version,
            publish_time: latest.publish_time,
          },
        });

        store.set({
          id,
          data,
          filePath: siteRelativePath,
          body: content,
        });
      }
    }

    await visit(root);
  },
};

const index = defineCollection({
  loader: indexLoader,
  schema: z.object({
    name: z.string(),
    version: z.string(),
    publish_time: z.string(),
  }),
});

export const collections = { index };
