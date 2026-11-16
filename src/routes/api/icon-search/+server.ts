import { json } from '@sveltejs/kit';
import { searchBrandIcons } from '#lib/server/brand-icon.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	const limitRaw = Number(url.searchParams.get('limit') ?? '24');
	const limit = Number.isFinite(limitRaw) ? Math.min(48, Math.max(1, limitRaw)) : 24;
	return json({ results: searchBrandIcons(q, limit) });
};
