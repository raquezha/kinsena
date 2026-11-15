import { parseOptionalAmount } from '../../domain/amount-parser.ts';
import type { PaydayCadence, ScheduledCadence } from '../../domain/cadence.ts';
import {
	formatPaydayTitle,
	inferCadence,
	midMonthAfter,
	monthEndAfter,
	nextPaydayDate,
	paydayAfter
} from '../../domain/calendar.ts';
import { localIsoDate } from '../../domain/dates.ts';
import { ensure } from '../../domain/errors.ts';
import { dueDateForPayday, templateFitsPayday } from '../../domain/fund-from.ts';
import { isReceived, type Payday, type TemplateItem } from '../../domain/models.ts';
import { formatEdit } from '../../domain/money.ts';
import { ensureMoney, normalizeDate, normalizeNote, normalizeTitle } from '../../domain/rules.ts';
import { sortForChecklist, summarize, type PaydayView } from '../../domain/summary.ts';
import type { Clock, NewRouteItem, Repositories } from '../ports.ts';
import { requireOpenPayday, requirePayday } from './guards.ts';

export interface NewOtherPayday {
	title: string;
	date: string;
	salary: string;
}

export interface History {
	paydays: PaydayView[];
	reopenableId: number | null;
}

export interface PaydayService {
	ensureUpcoming(): void;
	listOpen(): Payday[];
	view(paydayId: number): PaydayView;
	/** The payday the home screen should show, honouring a requested id. */
	active(preferredId?: number | null): PaydayView | null;
	createOther(input: NewOtherPayday): number;
	setExpected(paydayId: number, salary: string): void;
	setPayDate(paydayId: number, payDate: string): void;
	setNote(paydayId: number, note: string): void;
	receive(paydayId: number, salary: string): void;
	close(paydayId: number): void;
	reopen(paydayId: number): void;
	history(): History;
	/** The next already-open payday after this one, if any. */
	findNext(paydayId: number): Payday | null;
	/** The next open payday after this one, creating it if needed. */
	nextAfter(paydayId: number): Payday;
}

type Deps = Pick<Repositories, 'paydays' | 'items' | 'templates' | 'settings'>;

function fromTemplate(
	template: TemplateItem,
	paydayId: number,
	dueDate: string | null,
	sortOrder: number
): NewRouteItem {
	const amount = template.defaultAmount;
	return {
		paydayId,
		destinationId: template.destinationId,
		name: template.name,
		fullAmount: amount ?? 0,
		fullAmountExpr: amount === null ? '' : formatEdit(amount),
		minimumAmount: template.minimumAmount,
		chosenAmount: 0,
		decision: 'PENDING',
		dueDate,
		isDone: false,
		sortOrder,
		templateId: template.id
	};
}

export function createPaydayService(repos: Deps, clock: Clock): PaydayService {
	const { paydays, items, templates, settings } = repos;

	const viewOf = (payday: Payday): PaydayView => {
		const routeItems = sortForChecklist(items.listByPayday(payday.id));
		return { payday, items: routeItems, summary: summarize(payday, routeItems) };
	};

	const applyTemplates = (payday: Payday) => {
		let order = items.maxSortOrder(payday.id);
		for (const template of templates.listActive()) {
			if (items.hasTemplate(payday.id, template.id)) continue;
			if (!templateFitsPayday(template, payday)) continue;
			const dueDate = dueDateForPayday(template, payday);
			items.add(fromTemplate(template, payday.id, dueDate, ++order));
		}
	};

	const createScheduled = (date: string, cadence: ScheduledCadence): Payday => {
		const salaries = settings.get();
		const expected = cadence === 'MID_MONTH' ? salaries.midMonthSalary : salaries.monthEndSalary;
		ensureMoney(expected, 'salary');
		const id = paydays.create({
			title: formatPaydayTitle(date),
			cadence,
			scheduledDate: date,
			payDate: date,
			expectedAmount: expected,
			receivedAmount: null,
			receivedAt: null,
			note: null,
			createdAt: clock.now().getTime()
		});
		const payday = paydays.findById(id);
		ensure(payday !== null, 'Could not create payday');
		applyTemplates(payday);
		return payday;
	};

	const ensureDate = (date: string, cadence: ScheduledCadence): Payday => {
		let current = date;
		for (;;) {
			const existing = paydays.findByScheduledDate(current);
			if (existing?.isClosed) {
				current = paydayAfter(current, cadence);
				continue;
			}
			if (existing) return existing;
			return createScheduled(current, cadence);
		}
	};

	const service: PaydayService = {
		ensureUpcoming() {
			const today = localIsoDate(clock.now());
			ensureDate(nextPaydayDate(today, 'MID_MONTH'), 'MID_MONTH');
			ensureDate(nextPaydayDate(today, 'MONTH_END'), 'MONTH_END');
		},
		listOpen: () => paydays.listOpen(),
		view(paydayId) {
			return viewOf(requirePayday(paydays, paydayId));
		},
		active(preferredId) {
			service.ensureUpcoming();
			const open = paydays.listOpen();
			if (preferredId) {
				const preferred = paydays.findById(preferredId);
				if (preferred) return viewOf(preferred);
			}
			const received = open.find(isReceived);
			if (received) return viewOf(received);
			const upcoming = open[0];
			return upcoming ? viewOf(upcoming) : null;
		},
		createOther(input) {
			const scheduledDate = normalizeDate(input.date);
			ensure(
				paydays.findByScheduledDate(scheduledDate) === null,
				'A payday already exists on that date'
			);
			const expected = parseOptionalAmount(input.salary);
			ensureMoney(expected, 'salary');
			const cadence: PaydayCadence = inferCadence(scheduledDate);
			return paydays.create({
				title: normalizeTitle(input.title, scheduledDate),
				cadence: cadence === 'OTHER' ? 'OTHER' : cadence,
				scheduledDate,
				payDate: scheduledDate,
				expectedAmount: expected,
				receivedAmount: null,
				receivedAt: null,
				note: null,
				createdAt: clock.now().getTime()
			});
		},
		setExpected(paydayId, salary) {
			const amount = parseOptionalAmount(salary);
			requireOpenPayday(paydays, paydayId);
			paydays.update(paydayId, { expectedAmount: amount });
		},
		setPayDate(paydayId, payDate) {
			requireOpenPayday(paydays, paydayId);
			paydays.update(paydayId, { payDate: normalizeDate(payDate, 'pay date') });
		},
		setNote(paydayId, note) {
			requireOpenPayday(paydays, paydayId);
			paydays.update(paydayId, { note: normalizeNote(note) });
		},
		receive(paydayId, salary) {
			const payday = requireOpenPayday(paydays, paydayId);
			const entered = parseOptionalAmount(salary);
			const received = entered ?? payday.expectedAmount;
			ensure(received !== null, 'Enter the salary that arrived');
			ensureMoney(received, 'salary');
			paydays.update(paydayId, {
				receivedAmount: received,
				receivedAt: localIsoDate(clock.now())
			});
		},
		close(paydayId) {
			requireOpenPayday(paydays, paydayId);
			paydays.update(paydayId, { isClosed: true });
		},
		reopen(paydayId) {
			const closed = paydays.listClosed();
			const latest = closed[0];
			ensure(
				latest !== undefined && latest.id === paydayId,
				'Only the most recent finished payday can be reopened'
			);
			paydays.update(paydayId, { isClosed: false });
		},
		history() {
			const closed = paydays.listClosed();
			return {
				paydays: closed.map(viewOf),
				reopenableId: closed[0]?.id ?? null
			};
		},
		findNext(paydayId) {
			const payday = requirePayday(paydays, paydayId);
			return paydays.listOpen().find((entry) => entry.scheduledDate > payday.scheduledDate) ?? null;
		},
		nextAfter(paydayId) {
			const later = service.findNext(paydayId);
			if (later) return later;
			const payday = requirePayday(paydays, paydayId);
			const mid = midMonthAfter(payday.scheduledDate);
			const end = monthEndAfter(payday.scheduledDate);
			const nextDate = mid < end ? mid : end;
			const cadence = inferCadence(nextDate);
			ensure(cadence !== 'OTHER', 'Could not find the next payday');
			return ensureDate(nextDate, cadence);
		}
	};
	return service;
}

export function applyTemplateToUpcoming(
	repos: Pick<Repositories, 'paydays' | 'items'>,
	template: TemplateItem
): void {
	for (const payday of repos.paydays.listOpen()) {
		if (isReceived(payday) || payday.isClosed) continue;
		if (repos.items.hasTemplate(payday.id, template.id)) continue;
		if (!templateFitsPayday(template, payday)) continue;
		const dueDate = dueDateForPayday(template, payday);
		const sortOrder = repos.items.maxSortOrder(payday.id) + 1;
		repos.items.add(fromTemplate(template, payday.id, dueDate, sortOrder));
	}
}
