import { redirect } from '@sveltejs/kit';
import { formAction } from '#lib/server/http/actions.ts';
import { fields } from '#lib/server/http/forms.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => locals.services.paydays.history();

export const actions: Actions = {
	reopen: formAction({ paydayId: fields.id }, (form, { paydays }) => {
		paydays.reopen(form.paydayId);
		redirect(303, '/');
	})
};
