import type { ActivityEvent } from '../../domain/activity.ts';
import { parseOptionalAmount } from '../../domain/amount-parser.ts';
import type { PaydayCadence, ScheduledCadence } from '../../domain/cadence.ts';
import { formatPaydayTitle } from '../../domain/calendar.ts';
import { localIsoDate } from '../../domain/dates.ts';
import {
	inferSlotCadence,
	nextScheduledAfter,
	nextScheduledOnOrAfter
} from '../../domain/payday-calendar.ts';
import { ensure } from '../../domain/errors.ts';
import { isReceived, type Payday } from '../../domain/models.ts';
import { ensureMoney, normalizeDate, normalizeNote, normalizeTitle } from '../../domain/rules.ts';
import { sortForChecklist, summarize, type PaydayView } from '../../domain/summary.ts';
import type { Clock, Repositories } from '../ports.ts';
import { requireOpenPayday, requirePayday } from './guards.ts';
import { applyMissingDefaultsToPayday, type ApplyMissingResult } from './template-apply.ts';
import {
	arrivalNoteFor,
	isLockedPayday,
	recomputeOpenPayDates,
	resolvePayDate
} from './schedule-support.ts';

export interface NewOtherPayday {
	title: string;
	date: string;
	salary: string;
}

export interface History {
	paydays: PaydayView[];
	reopenableId: number | null;
	activity: ActivityEvent[];
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
	/** Drop a manual pay-date override and restore the computed date. */
	resetPayDate(paydayId: number): void;
	/** Add active defaults missing from this open payday. */
	applyMissingDefaults(paydayId: number): ApplyMissingResult;
}

type Deps = Pick<
	Repositories,
	| 'paydays'
	| 'items'
	| 'templates'
	| 'settings'
	| 'holidays'
	| 'payOverrides'
	| 'activity'
	| 'transaction'
>;

export function createPaydayService(repos: Deps, clock: Clock): PaydayService {
	const { paydays, items, settings, activity, transaction } = repos;

	const viewOf = (payday: Payday): PaydayView => {
		const routeItems = sortForChecklist(items.listByPayday(payday.id));
		return {
			payday,
			items: routeItems,
			summary: summarize(payday, routeItems),
			arrivalNote: arrivalNoteFor(repos, payday)
		};
	};

	const applyTemplates = (payday: Payday) => {
		applyMissingDefaultsToPayday(repos, payday);
	};

	const createScheduled = (date: string, cadence: ScheduledCadence): Payday => {
		const salaries = settings.get();
		const expected = cadence === 'MID_MONTH' ? salaries.midMonthSalary : salaries.monthEndSalary;
		ensureMoney(expected, 'salary');
		const id = paydays.create({
			title: formatPaydayTitle(date),
			cadence,
			scheduledDate: date,
			payDate: resolvePayDate(repos, date),
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
				current = nextScheduledAfter(current, cadence, settings.get().payRule);
				continue;
			}
			if (existing) return existing;
			return createScheduled(current, cadence);
		}
	};

	const service: PaydayService = {
		ensureUpcoming() {
			recomputeOpenPayDates(repos);
			const today = localIsoDate(clock.now());
			const rule = settings.get().payRule;
			ensureDate(nextScheduledOnOrAfter(today, 'MID_MONTH', rule), 'MID_MONTH');
			ensureDate(nextScheduledOnOrAfter(today, 'MONTH_END', rule), 'MONTH_END');
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
			const cadence: PaydayCadence = inferSlotCadence(scheduledDate, settings.get().payRule);
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
			const payday = requireOpenPayday(paydays, paydayId);
			ensure(!isLockedPayday(payday), 'Received or finished paydays cannot move');
			const next = normalizeDate(payDate, 'pay date');
			repos.payOverrides.set(payday.scheduledDate, next);
			paydays.update(paydayId, { payDate: next });
		},
		resetPayDate(paydayId) {
			const payday = requireOpenPayday(paydays, paydayId);
			ensure(!isLockedPayday(payday), 'Received or finished paydays cannot move');
			repos.payOverrides.remove(payday.scheduledDate);
			paydays.update(paydayId, { payDate: resolvePayDate(repos, payday.scheduledDate) });
		},
		applyMissingDefaults(paydayId) {
			const payday = requireOpenPayday(paydays, paydayId);
			return applyMissingDefaultsToPayday(repos, payday);
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
			transaction(() => {
				const payday = requireOpenPayday(paydays, paydayId);
				paydays.update(paydayId, { isClosed: true });
				activity.add({
					createdAt: clock.now().getTime(),
					action: 'finish',
					paydayId,
					entityType: 'payday',
					entityId: paydayId,
					summary: `Finished ${payday.title}`
				});
			});
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
				reopenableId: closed[0]?.id ?? null,
				activity: activity.listRecent(50)
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
			const rule = settings.get().payRule;
			const mid = nextScheduledAfter(payday.scheduledDate, 'MID_MONTH', rule);
			const end = nextScheduledAfter(payday.scheduledDate, 'MONTH_END', rule);
			const nextDate = mid < end ? mid : end;
			const cadence = inferSlotCadence(nextDate, rule);
			ensure(cadence !== 'OTHER', 'Could not find the next payday');
			return ensureDate(nextDate, cadence);
		}
	};
	return service;
}
