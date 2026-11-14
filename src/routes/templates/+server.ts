import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/** Kinsena 0.1 called the Defaults page /templates. Keep old bookmarks working. */
export const GET: RequestHandler = () => redirect(308, '/defaults');
