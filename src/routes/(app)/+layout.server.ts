import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => ({
	currency: locals.services.settings.currency(),
	version: __APP_VERSION__
});
