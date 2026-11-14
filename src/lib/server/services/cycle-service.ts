import { parseOptionalAmount } from '../../domain/amount-parser.ts';
import { cadenceMatches, type Cadence } from '../../domain/cadence.ts';
import { localIsoDate } from '../../domain/dates.ts';
import { ensure } from '../../domain/errors.ts';
import type { Cycle, TemplateItem } from '../../domain/models.ts';
import { formatEdit } from '../../domain/money.ts';
import { normalizeNote, normalizeTitle } from '../../domain/rules.ts';
import { sortForChecklist, summarize, type CycleView } from '../../domain/summary.ts';
import type { Clock, NewCycle, NewCycleItem, Repositories } from '../ports.ts';
import { requireOpenCycle } from './guards.ts';

export interface StartCycleInput {
	title: string;
	cadence: Cadence;
	salary: string;
}

export interface History {
	cycles: CycleView[];
	/** The finished cycle that may be reopened, if any. */
	reopenableId: number | null;
}

export interface CycleService {
	getActive(): CycleView | null;
	start(input: StartCycleInput): number;
	setSalary(cycleId: number, salary: string): void;
	setNote(cycleId: number, note: string): void;
	finish(cycleId: number): void;
	reopen(cycleId: number): void;
	clear(cycleId: number): void;
	history(): History;
}

type Deps = Pick<Repositories, 'cycles' | 'items' | 'templates'>;

function itemFromTemplate(template: TemplateItem, sortOrder: number): NewCycleItem {
	const amount = template.defaultAmount;
	return {
		name: template.name,
		amount: amount ?? 0,
		amountExpr: amount === null ? '' : formatEdit(amount),
		isDone: false,
		sortOrder
	};
}

function planCycle(input: StartCycleInput, saved: TemplateItem[], now: Date) {
	const today = localIsoDate(now);
	const cycle: NewCycle = {
		title: normalizeTitle(input.title, today),
		date: today,
		salary: parseOptionalAmount(input.salary),
		note: null,
		createdAt: now.getTime()
	};
	const chosen = saved.filter((template) => cadenceMatches(template.cadence, input.cadence));
	return { cycle, items: chosen.map(itemFromTemplate) };
}

export function createCycleService({ cycles, items, templates }: Deps, clock: Clock) {
	const view = (cycle: Cycle): CycleView => {
		const cycleItems = sortForChecklist(items.listByCycle(cycle.id));
		return { cycle, items: cycleItems, summary: summarize(cycle, cycleItems) };
	};
	const ensureNoOpenCycle = () =>
		ensure(cycles.findOpen() === null, 'Finish the current cycle first');

	const service: CycleService = {
		getActive() {
			const open = cycles.findOpen();
			return open ? view(open) : null;
		},
		start(input) {
			ensureNoOpenCycle();
			const { cycle, items: newItems } = planCycle(input, templates.listActive(), clock.now());
			return cycles.create(cycle, newItems);
		},
		setSalary(cycleId, salary) {
			const amount = parseOptionalAmount(salary);
			requireOpenCycle(cycles, cycleId);
			cycles.update(cycleId, { salary: amount });
		},
		setNote(cycleId, note) {
			const cleaned = normalizeNote(note);
			requireOpenCycle(cycles, cycleId);
			cycles.update(cycleId, { note: cleaned });
		},
		finish(cycleId) {
			requireOpenCycle(cycles, cycleId);
			cycles.update(cycleId, { isClosed: true });
		},
		reopen(cycleId) {
			ensureNoOpenCycle();
			const latest = cycles.findLatest();
			ensure(
				latest !== null && latest.id === cycleId && latest.isClosed,
				'Only the most recent finished cycle can be reopened'
			);
			cycles.update(cycleId, { isClosed: false });
		},
		clear(cycleId) {
			requireOpenCycle(cycles, cycleId);
			items.removeByCycle(cycleId);
		},
		history() {
			const closed = cycles.listClosed();
			const latest = cycles.findLatest();
			const reopenable = latest?.isClosed && cycles.findOpen() === null ? latest.id : null;
			return { cycles: closed.map(view), reopenableId: reopenable };
		}
	};
	return service;
}
