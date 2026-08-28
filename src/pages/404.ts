import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = ({ url }) =>
  new Response(
    JSON.stringify({
      error: `Not Found ${url.pathname}`,
      status: 404,
    }),
    {
      status: 404,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    },
  );
