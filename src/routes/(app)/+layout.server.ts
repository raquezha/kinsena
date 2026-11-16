import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {
	const paydays = locals.services.paydays;
	paydays.ensureUpcoming();
	return {
		currency: locals.services.settings.currency(),
		version: __APP_VERSION__,
		openPaydays: paydays.listOpen(),
		destinations: locals.services.destinations.list(),
		templates: locals.services.templates.list()
	};
};
