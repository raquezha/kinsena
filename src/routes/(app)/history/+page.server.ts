import { redirect } from '@sveltejs/kit';
import { resolveBrandIcon } from '#lib/server/brand-icon.ts';
import { formAction } from '#lib/server/http/actions.ts';
import { fields } from '#lib/server/http/forms.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	const history = locals.services.paydays.history();
	return {
		...history,
		destinations: locals.services.destinations.list().map((destination) => ({
			...destination,
			brandIcon: resolveBrandIcon(destination.name)
		}))
	};
};

export const actions: Actions = {
	reopen: formAction({ paydayId: fields.id }, (form, { paydays }) => {
		paydays.reopen(form.paydayId);
		redirect(303, '/');
	})
};
