import { redirect } from '@sveltejs/kit';
import { formAction } from '#lib/server/http/actions.ts';
import { fields } from '#lib/server/http/forms.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => locals.services.cycles.history();

export const actions: Actions = {
	reopen: formAction({ cycleId: fields.id }, (form, { cycles }) => {
		cycles.reopen(form.cycleId);
		redirect(303, '/');
	})
};
