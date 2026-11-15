import { formAction } from '#lib/server/http/actions.ts';
import { fields } from '#lib/server/http/forms.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => {
	const raw = url.searchParams.get('year');
	const parsed = raw ? Number(raw) : NaN;
	const year = Number.isInteger(parsed) ? parsed : undefined;
	return { calendar: locals.services.schedule.calendar(year) };
};

export const actions: Actions = {
	setOverride: formAction(
		{ scheduledDate: fields.date, payDate: fields.date },
		(form, { schedule }) => schedule.setOverride(form.scheduledDate, form.payDate)
	),
	resetOverride: formAction({ scheduledDate: fields.date }, (form, { schedule }) =>
		schedule.resetOverride(form.scheduledDate)
	)
};
