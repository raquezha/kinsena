import { formAction } from '#lib/server/http/actions.ts';
import { fields } from '#lib/server/http/forms.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => ({
	templates: locals.services.templates.list()
});

const templateId = fields.id;

export const actions: Actions = {
	add: formAction(
		{ name: fields.name, amount: fields.amount, cadence: fields.cadence },
		(form, { templates }) => ({ templateId: templates.add(form) })
	),
	amount: formAction({ templateId, amount: fields.amount }, (form, { templates }) =>
		templates.updateAmount(form.templateId, form.amount)
	),
	archive: formAction({ templateId }, (form, { templates }) => templates.archive(form.templateId))
};
