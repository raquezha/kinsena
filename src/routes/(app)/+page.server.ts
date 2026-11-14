import { formAction } from '#lib/server/http/actions.ts';
import { fields } from '#lib/server/http/forms.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => ({
	active: locals.services.cycles.getActive(),
	savedCount: locals.services.templates.list().length
});

const cycleId = fields.id;
const itemId = fields.id;

export const actions: Actions = {
	start: formAction(
		{ title: fields.title, cadence: fields.cadence, salary: fields.amount },
		(form, { cycles }) => ({ cycleId: cycles.start(form) })
	),
	salary: formAction({ cycleId, salary: fields.amount }, (form, { cycles }) =>
		cycles.setSalary(form.cycleId, form.salary)
	),
	note: formAction({ cycleId, note: fields.note }, (form, { cycles }) =>
		cycles.setNote(form.cycleId, form.note)
	),
	finish: formAction({ cycleId }, (form, { cycles }) => cycles.finish(form.cycleId)),
	clear: formAction({ cycleId }, (form, { cycles }) => cycles.clear(form.cycleId)),
	add: formAction({ cycleId, name: fields.name, amount: fields.amount }, (form, { items }) => ({
		itemId: items.add(form.cycleId, form.name, form.amount)
	})),
	toggle: formAction({ itemId }, (form, { items }) => ({
		itemId: form.itemId,
		paid: items.toggle(form.itemId)
	})),
	amount: formAction({ itemId, amount: fields.amount }, (form, { items }) =>
		items.setAmount(form.itemId, form.amount)
	),
	remove: formAction({ itemId }, (form, { items }) => ({ removed: items.remove(form.itemId) })),
	restore: formAction(
		{
			cycleId,
			name: fields.name,
			amountExpr: fields.amount,
			isDone: fields.flag,
			sortOrder: fields.position
		},
		(form, { items }) => ({ itemId: items.restore(form) })
	)
};
