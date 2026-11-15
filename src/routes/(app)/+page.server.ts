import { formAction } from '#lib/server/http/actions.ts';
import { fields } from '#lib/server/http/forms.ts';
import { isReceived } from '#lib/domain/models.ts';
import { parseApprovedLines, parseUndoPayload } from '#lib/server/services/plan-service.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => {
	const raw = url.searchParams.get('p');
	const preferredId = raw && Number.isInteger(Number(raw)) ? Number(raw) : null;
	const active = locals.services.paydays.active(preferredId);
	const next = active ? locals.services.paydays.findNext(active.payday.id) : null;
	const currency = locals.services.settings.currency();
	const plan =
		active && isReceived(active.payday)
			? locals.services.plans.build(active.payday.id, currency)
			: null;
	const finishIssues = active ? locals.services.plans.finishIssues(active.payday.id) : [];
	return { active, nextScheduledDate: next?.scheduledDate ?? null, plan, finishIssues };
};

const paydayId = fields.id;
const itemId = fields.id;
const itemFields = {
	name: fields.name,
	amount: fields.amount,
	minimum: fields.amount,
	dueDate: fields.date,
	destinationId: fields.optionalId
};

export const actions: Actions = {
	receive: formAction({ paydayId, salary: fields.amount }, (form, { paydays }) =>
		paydays.receive(form.paydayId, form.salary)
	),
	expected: formAction({ paydayId, salary: fields.amount }, (form, { paydays }) =>
		paydays.setExpected(form.paydayId, form.salary)
	),
	payDate: formAction({ paydayId, payDate: fields.date }, (form, { paydays }) =>
		paydays.setPayDate(form.paydayId, form.payDate)
	),
	note: formAction({ paydayId, note: fields.note }, (form, { paydays }) =>
		paydays.setNote(form.paydayId, form.note)
	),
	finish: formAction({ paydayId }, (form, { paydays }) => paydays.close(form.paydayId)),
	other: formAction(
		{ title: fields.title, date: fields.date, salary: fields.amount },
		(form, { paydays }) => ({ paydayId: paydays.createOther(form) })
	),
	add: formAction({ paydayId: fields.optionalId, ...itemFields }, (form, { items }) => ({
		itemId: items.add(form)
	})),
	update: formAction({ itemId, ...itemFields }, (form, { items }) =>
		items.update(form.itemId, form)
	),
	decide: formAction(
		{ itemId, decision: fields.decision, amount: fields.amount },
		(form, { items, plans }) => {
			const undo = plans.capture([form.itemId]);
			items.decide(form.itemId, form.decision, form.amount);
			return { undo };
		}
	),
	skip: formAction({ itemId, moveToNext: fields.flag }, (form, { items, plans }) => {
		const undo = plans.capture([form.itemId]);
		items.skip(form.itemId, form.moveToNext);
		return { undo };
	}),
	toggle: formAction({ itemId }, (form, { items, plans }) => {
		const undo = plans.capture([form.itemId]);
		return { itemId: form.itemId, done: items.toggleDone(form.itemId), undo };
	}),
	assign: formAction({ itemId, paydayId: fields.optionalId }, (form, { items, plans }) => {
		const undo = plans.capture([form.itemId]);
		items.assign(form.itemId, form.paydayId);
		return { undo };
	}),
	remove: formAction({ itemId }, (form, { items }) => {
		const removed = items.remove(form.itemId);
		return { removed, undo: { kind: 'removed' as const, removed } };
	}),
	restore: formAction(
		{
			paydayId: fields.optionalId,
			destinationId: fields.optionalId,
			name: fields.name,
			fullAmountExpr: fields.amount,
			minimumAmount: fields.cents,
			chosenAmount: fields.cents,
			decision: fields.decision,
			decisionReason: fields.note,
			dueDate: fields.date,
			isDone: fields.flag,
			sortOrder: fields.position,
			templateId: fields.optionalId
		},
		(form, { items }) => ({
			itemId: items.restore({
				...form,
				chosenAmount: form.chosenAmount ?? 0,
				decisionReason: form.decisionReason.trim() === '' ? null : form.decisionReason,
				dueDate: form.dueDate.trim() === '' ? null : form.dueDate
			})
		})
	),
	approvePlan: formAction({ paydayId, plan: fields.json }, (form, { plans }) => ({
		undo: plans.approve(form.paydayId, parseApprovedLines(form.plan))
	})),
	undo: formAction({ payload: fields.json }, (form, { plans, items }) => {
		plans.restore(parseUndoPayload(form.payload), (removed) => items.restore(removed));
	})
};
