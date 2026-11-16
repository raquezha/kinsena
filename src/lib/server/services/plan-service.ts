import type { FinishIssue } from '../../domain/finish.ts';
import { hasKnownAmount, isReceived, type RouteItem } from '../../domain/models.ts';
import { DomainError, ensure } from '../../domain/errors.ts';
import { proposePlan, type PlanProposal, type PlannerItem } from '../../domain/planner.ts';
import { DECISIONS, isRoutedDecision, type Decision } from '../../domain/decision.ts';
import { z } from 'zod';
import { formatEdit } from '../../domain/money.ts';
import type { CurrencyCode } from '../../domain/currency.ts';
import type { Repositories } from '../ports.ts';
import type { PaydayService } from './payday-service.ts';
import type { RemovedItem } from './route-service.ts';
import { requireOpenPayday } from './guards.ts';

export interface ItemUndoSnapshot {
	id: number;
	paydayId: number | null;
	destinationId: number | null;
	name: string;
	fullAmount: number;
	fullAmountExpr: string | null;
	minimumAmount: number | null;
	chosenAmount: number;
	decision: Decision;
	decisionReason: string | null;
	dueDate: string | null;
	isDone: boolean;
	sortOrder: number;
	templateId: number | null;
	icon: string | null;
}

export type UndoPayload =
	{ kind: 'items'; items: ItemUndoSnapshot[] } | { kind: 'removed'; removed: RemovedItem };

export interface ApprovedLine {
	itemId: number;
	decision: Decision;
	amount: number;
	reason: string;
}

export interface LastPaid {
	amount: number;
	paidOn: string;
}

export interface PlanService {
	build(paydayId: number, currency: CurrencyCode): PlanProposal;
	approve(paydayId: number, lines: ApprovedLine[]): UndoPayload;
	finishIssues(paydayId: number): FinishIssue[];
	capture(itemIds: number[]): UndoPayload;
	restore(payload: UndoPayload, restoreRemoved: (removed: RemovedItem) => number): void;
}

export function snapshotItem(item: RouteItem): ItemUndoSnapshot {
	return {
		id: item.id,
		paydayId: item.paydayId,
		destinationId: item.destinationId,
		name: item.name,
		fullAmount: item.fullAmount,
		fullAmountExpr: item.fullAmountExpr,
		minimumAmount: item.minimumAmount,
		chosenAmount: item.chosenAmount,
		decision: item.decision,
		decisionReason: item.decisionReason,
		dueDate: item.dueDate,
		isDone: item.isDone,
		sortOrder: item.sortOrder,
		templateId: item.templateId,
		icon: item.icon
	};
}

export function lastPaidByTemplate(repos: Repositories): Map<number, LastPaid> {
	const found = new Map<number, LastPaid>();
	for (const payday of repos.paydays.listClosed()) {
		for (const item of repos.items.listByPayday(payday.id)) {
			if (item.templateId === null || found.has(item.templateId)) continue;
			if (!isRoutedDecision(item.decision) || item.chosenAmount <= 0) continue;
			found.set(item.templateId, { amount: item.chosenAmount, paidOn: payday.scheduledDate });
		}
	}
	return found;
}

export function createPlanService(repos: Repositories, paydays: PaydayService): PlanService {
	const capture = (itemIds: number[]): UndoPayload => {
		const items = itemIds.map((id) => {
			const item = repos.items.findById(id);
			ensure(item !== null, 'Unknown item');
			return snapshotItem(item);
		});
		return { kind: 'items', items };
	};

	return {
		build(paydayId, currency) {
			const view = paydays.view(paydayId);
			const lastPaid = lastPaidByTemplate(repos);
			const plannerItems: PlannerItem[] = view.items.map((item) => {
				const paid = item.templateId === null ? undefined : lastPaid.get(item.templateId);
				const destination = item.destinationId
					? repos.destinations.findById(item.destinationId)
					: null;
				return {
					id: item.id,
					name: item.name,
					destinationName: destination?.name ?? null,
					dueDate: item.dueDate,
					fullAmount: item.fullAmount,
					hasKnownFull: hasKnownAmount(item),
					minimumAmount: item.minimumAmount,
					lastPaidAmount: paid?.amount ?? null,
					lastPaidOn: paid?.paidOn ?? null,
					sortOrder: item.sortOrder
				};
			});
			const next = paydays.findNext(paydayId);
			return proposePlan({
				salary: isReceived(view.payday) ? (view.payday.receivedAmount ?? null) : null,
				items: plannerItems,
				nextPaydayDate: next?.payDate ?? null,
				currency
			});
		},
		approve(paydayId, lines) {
			requireOpenPayday(repos.paydays, paydayId);
			ensure(isReceived(paydays.view(paydayId).payday), 'Mark salary as received first');
			const undo = capture(lines.map((line) => line.itemId));
			for (const line of lines) {
				const item = repos.items.findById(line.itemId);
				ensure(item !== null && item.paydayId === paydayId, 'Unknown item');
				const patch: Parameters<Repositories['items']['update']>[1] = {
					decision: line.decision,
					chosenAmount: line.decision === 'SKIPPED' ? 0 : line.amount,
					decisionReason: line.reason,
					isDone: false
				};
				if (line.decision === 'FULL' && !hasKnownAmount(item) && line.amount > 0) {
					patch.fullAmount = line.amount;
					patch.fullAmountExpr = formatEdit(line.amount);
				}
				repos.items.update(item.id, patch);
			}
			return undo;
		},
		finishIssues(paydayId) {
			const issues: FinishIssue[] = [];
			for (const item of paydays.view(paydayId).items) {
				if (item.decision === 'PENDING') {
					issues.push({ itemId: item.id, name: item.name, kind: 'pending' });
				} else if (item.decision === 'SKIPPED') {
					issues.push({ itemId: item.id, name: item.name, kind: 'skipped' });
				} else if (!item.isDone) {
					issues.push({ itemId: item.id, name: item.name, kind: 'undone' });
				}
			}
			return issues;
		},
		capture,
		restore(payload, restoreRemoved) {
			if (payload.kind === 'removed') {
				restoreRemoved(payload.removed);
				return;
			}
			for (const snapshot of payload.items) {
				const current = repos.items.findById(snapshot.id);
				ensure(current !== null, 'Unknown item');
				repos.items.update(snapshot.id, {
					paydayId: snapshot.paydayId,
					destinationId: snapshot.destinationId,
					name: snapshot.name,
					fullAmount: snapshot.fullAmount,
					fullAmountExpr: snapshot.fullAmountExpr,
					minimumAmount: snapshot.minimumAmount,
					chosenAmount: snapshot.chosenAmount,
					decision: snapshot.decision,
					decisionReason: snapshot.decisionReason,
					dueDate: snapshot.dueDate,
					isDone: snapshot.isDone,
					sortOrder: snapshot.sortOrder,
					templateId: snapshot.templateId,
					icon: snapshot.icon
				});
			}
		}
	};
}

const approvedLineSchema = z.object({
	itemId: z.number().int().positive(),
	decision: z.enum(DECISIONS),
	amount: z.number().int().nonnegative(),
	reason: z.string().max(280)
});

const itemSnapshotSchema = z.object({
	id: z.number().int().positive(),
	paydayId: z.number().int().positive().nullable(),
	destinationId: z.number().int().positive().nullable(),
	name: z.string(),
	fullAmount: z.number().int().nonnegative(),
	fullAmountExpr: z.string().nullable(),
	minimumAmount: z.number().int().nonnegative().nullable(),
	chosenAmount: z.number().int().nonnegative(),
	decision: z.enum(DECISIONS),
	decisionReason: z.string().nullable(),
	dueDate: z.string().nullable(),
	isDone: z.boolean(),
	sortOrder: z.number().int(),
	templateId: z.number().int().positive().nullable(),
	icon: z
		.string()
		.max(64)
		.nullable()
		.optional()
		.transform((value) => value ?? null)
});

const undoPayloadSchema = z.discriminatedUnion('kind', [
	z.object({ kind: z.literal('items'), items: z.array(itemSnapshotSchema).min(1) }),
	z.object({
		kind: z.literal('removed'),
		removed: z.object({
			paydayId: z.number().int().positive().nullable(),
			destinationId: z.number().int().positive().nullable(),
			name: z.string(),
			fullAmountExpr: z.string().nullable(),
			minimumAmount: z.number().int().nonnegative().nullable(),
			chosenAmount: z.number().int().nonnegative(),
			decision: z.enum(DECISIONS),
			decisionReason: z.string().nullable(),
			dueDate: z.string().nullable(),
			isDone: z.boolean(),
			sortOrder: z.number().int(),
			templateId: z.number().int().positive().nullable(),
			icon: z
				.string()
				.max(64)
				.nullable()
				.optional()
				.transform((value) => value ?? null)
		})
	})
]);

function parsed<T>(schema: z.ZodType<T>, value: unknown, message: string): T {
	const result = schema.safeParse(value);
	if (!result.success) throw new DomainError(message);
	return result.data;
}

export function parseApprovedLines(value: unknown): ApprovedLine[] {
	return parsed(z.array(approvedLineSchema).min(1), value, 'Check the plan and try again');
}

export function parseUndoPayload(value: unknown): UndoPayload {
	return parsed(undoPayloadSchema, value, 'Nothing to undo');
}
