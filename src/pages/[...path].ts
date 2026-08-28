import { getCollection, type CollectionEntry } from 'astro:content';
import type { APIRoute } from 'astro';

type RegistryEntry = CollectionEntry<'index'>;

type EndpointPath = {
  params: { path: string };
  props: { entry: RegistryEntry };
};

export async function getStaticPaths(): Promise<EndpointPath[]> {
  const entries = await getCollection('index');

  return entries.map((entry) => ({
    params: { path: entry.id },
    props: { entry },
  }));
}

export const GET: APIRoute = ({ props }) => {
  const entry = props.entry as RegistryEntry;

  return new Response(entry.body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
};
