import { formAction } from '#lib/server/http/actions.ts';
import { fields } from '#lib/server/http/forms.ts';
import { isCurrencyCode } from '#lib/domain/currency.ts';
import { ensure } from '#lib/domain/errors.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => ({
	settings: locals.services.settings.get()
});

export const actions: Actions = {
	currency: formAction({ currency: fields.currency }, (form, { settings }) => {
		ensure(isCurrencyCode(form.currency), 'Choose a supported currency');
		settings.setCurrency(form.currency);
	}),
	salaries: formAction({ midMonth: fields.amount, monthEnd: fields.amount }, (form, { settings }) =>
		settings.setSalaries(form.midMonth, form.monthEnd)
	)
};
