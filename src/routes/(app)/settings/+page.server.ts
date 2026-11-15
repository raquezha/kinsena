import { formAction } from '#lib/server/http/actions.ts';
import { fields } from '#lib/server/http/forms.ts';
import { isCurrencyCode } from '#lib/domain/currency.ts';
import { ensure } from '#lib/domain/errors.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => ({
	settings: locals.services.settings.get(),
	holidays: locals.services.schedule.holidays()
});

export const actions: Actions = {
	currency: formAction({ currency: fields.currency }, (form, { settings }) => {
		ensure(isCurrencyCode(form.currency), 'Choose a supported currency');
		settings.setCurrency(form.currency);
	}),
	salaries: formAction({ midMonth: fields.amount, monthEnd: fields.amount }, (form, { settings }) =>
		settings.setSalaries(form.midMonth, form.monthEnd)
	),
	payRule: formAction(
		{
			daysOfMonth: fields.name,
			shift: fields.shift,
			weekendDays: fields.name,
			includeNationalHolidays: fields.flag,
			includeLocalHolidays: fields.flag
		},
		(form, { schedule }) => schedule.setPayRule(form)
	),
	addHoliday: formAction(
		{ date: fields.date, name: fields.name, kind: fields.holidayKind },
		(form, { schedule }) => schedule.addHoliday(form)
	),
	removeHoliday: formAction({ id: fields.id }, (form, { schedule }) =>
		schedule.removeHoliday(form.id)
	)
};
