import { json } from '@sveltejs/kit';
import { resolveBrandMatch } from '#lib/server/brand-icon.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url }) => {
	const name = url.searchParams.get('name')?.trim() ?? '';
	if (!name) return json({ brandIcon: null, key: null, name: null });
	const match = resolveBrandMatch(name);
	if (!match) return json({ brandIcon: null, key: null, name: null });
	return json({ brandIcon: match.brandIcon, key: match.key, name: match.name });
};
