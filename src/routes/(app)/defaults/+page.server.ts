import { brandKeyFromIcon } from '#lib/domain/template-icon.ts';
import { resolveBrandIcon } from '#lib/server/brand-icon.ts';
import { formAction } from '#lib/server/http/actions.ts';
import { fields } from '#lib/server/http/forms.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => ({
	templates: locals.services.templates.list().map((template) => {
		const brandKey = brandKeyFromIcon(template.icon ?? '');
		const resolvedBrandIcon = brandKey
			? resolveBrandIcon(brandKey)
			: template.icon
				? null
				: resolveBrandIcon(template.name);
		return { ...template, resolvedBrandIcon };
	}),
	destinations: locals.services.destinations.list().map((destination) => ({
		...destination,
		brandIcon: resolveBrandIcon(destination.name)
	}))
});

const templateId = fields.id;
const destinationId = fields.id;
const templateFields = {
	name: fields.name,
	amount: fields.amount,
	minimum: fields.amount,
	dueDay: fields.dueDay,
	fundFrom: fields.fundFrom,
	destinationId: fields.optionalId,
	installmentCount: fields.dueDay,
	icon: fields.icon
};

export const actions: Actions = {
	add: formAction({ ...templateFields, applyToOpen: fields.flag }, (form, { templates }) => ({
		templateId: templates.add(form)
	})),
	update: formAction({ templateId, ...templateFields }, (form, { templates }) =>
		templates.update(form.templateId, form)
	),
	toggleActive: formAction({ templateId }, (form, { templates }) => ({
		isActive: templates.toggleActive(form.templateId)
	})),
	archive: formAction({ templateId }, (form, { templates }) => templates.archive(form.templateId)),
	addDestination: formAction(
		{ name: fields.name, kind: fields.kind },
		(form, { destinations }) => ({
			destinationId: destinations.add(form.name, form.kind)
		})
	),
	updateDestination: formAction(
		{ destinationId, name: fields.name, kind: fields.kind },
		(form, { destinations }) => destinations.update(form.destinationId, form.name, form.kind)
	),
	archiveDestination: formAction({ destinationId }, (form, { destinations }) =>
		destinations.archive(form.destinationId)
	)
};
