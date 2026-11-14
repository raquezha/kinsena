import { formAction } from '#lib/server/http/actions.ts';
import { fields } from '#lib/server/http/forms.ts';
import { isCurrencyCode } from '#lib/domain/currency.ts';
import { ensure } from '#lib/domain/errors.ts';
import type { Actions } from './$types';

export const actions: Actions = {
	currency: formAction({ currency: fields.currency }, (form, { settings }) => {
		ensure(isCurrencyCode(form.currency), 'Choose a supported currency');
		settings.setCurrency(form.currency);
	})
};
