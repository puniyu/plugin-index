import { getCollection } from "astro:content";
import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async () => {
  const entries = await getCollection("index");
  const lastPackage = entries.length > 0
    ? entries.reduce((a, b) =>
      a.data.publish_time > b.data.publish_time ? a : b
    )
      .data
    : null;
  const body = JSON.stringify({
    last_package: lastPackage,
    count: entries.length,
  });
  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
};
