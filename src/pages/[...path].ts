import { getCollection } from 'astro:content';
import type { APIRoute, InferGetStaticPropsType } from 'astro';

export async function getStaticPaths() {
  const entries = await getCollection('index');

  return entries.map((entry) => ({
    params: { path: entry.id },
    props: { entry },
  }));
}

export const GET: APIRoute = ({ props }) => {
   const { entry } = props as InferGetStaticPropsType<typeof getStaticPaths>;

  return new Response(entry.body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
};
