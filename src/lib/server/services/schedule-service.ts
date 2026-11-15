import { ensure } from '../../domain/errors.ts';
import type { Holiday } from '../../domain/models.ts';
import {
	formatDaysOfMonth,
	isHolidayKind,
	normalizePayRule,
	parseDaysOfMonth,
	parseWeekendDays,
	type HolidayKind,
	type PayRule,
	type ShiftDirection
} from '../../domain/pay-rule.ts';
import { yearSchedule, type ScheduleEntry } from '../../domain/payday-calendar.ts';
import { normalizeDate, normalizeName } from '../../domain/rules.ts';
import type { Clock } from '../ports.ts';
import {
	isLockedPayday,
	lockedPayDates,
	recomputeOpenPayDates,
	resolvePayDate,
	type ScheduleRepos
} from './schedule-support.ts';

export interface PayRuleInput {
	daysOfMonth: string;
	shift: ShiftDirection;
	weekendDays: string;
	includeNationalHolidays: boolean;
	includeLocalHolidays: boolean;
}

export interface NewHolidayInput {
	date: string;
	name: string;
	kind: string;
}

export interface CalendarRow extends ScheduleEntry {
	paydayId: number | null;
}

export interface ScheduleService {
	rule(): PayRule;
	setPayRule(input: PayRuleInput): void;
	holidays(): Holiday[];
	addHoliday(input: NewHolidayInput): number;
	removeHoliday(id: number): void;
	calendar(year?: number): { year: number; entries: CalendarRow[] };
	setOverride(scheduledDate: string, payDate: string): void;
	resetOverride(scheduledDate: string): void;
}

function paydayIds(repos: ScheduleRepos): Map<string, number> {
	const ids = new Map<string, number>();
	for (const payday of [...repos.paydays.listOpen(), ...repos.paydays.listClosed()]) {
		ids.set(payday.scheduledDate, payday.id);
	}
	return ids;
}

function applyToOpenPayday(repos: ScheduleRepos, scheduledDate: string, payDate: string): void {
	const payday = repos.paydays.findByScheduledDate(scheduledDate);
	if (!payday || isLockedPayday(payday)) return;
	if (payday.payDate !== payDate) repos.paydays.update(payday.id, { payDate });
}

export function parsePayRuleInput(input: PayRuleInput): PayRule {
	const days = parseDaysOfMonth(input.daysOfMonth);
	ensure(days !== null, 'Enter two different days between 1 and 31');
	const weekends = parseWeekendDays(input.weekendDays);
	ensure(weekends !== null, 'Choose which weekdays are non-working');
	return normalizePayRule({
		daysOfMonth: days,
		shift: input.shift,
		weekendDays: weekends,
		includeNationalHolidays: input.includeNationalHolidays,
		includeLocalHolidays: input.includeLocalHolidays
	});
}

export function createScheduleService(repos: ScheduleRepos, clock: Clock): ScheduleService {
	const currentYear = () => clock.now().getFullYear();

	return {
		rule: () => repos.settings.get().payRule,
		setPayRule(input) {
			repos.settings.setPayRule(parsePayRuleInput(input));
			recomputeOpenPayDates(repos);
		},
		holidays: () => repos.holidays.list(),
		addHoliday(input) {
			const date = normalizeDate(input.date);
			const name = normalizeName(input.name);
			ensure(isHolidayKind(input.kind), 'Choose national or local');
			const kind: HolidayKind = input.kind;
			const duplicate = repos.holidays
				.list()
				.some((holiday) => holiday.date === date && holiday.name === name);
			ensure(!duplicate, 'That holiday is already on the list');
			const id = repos.holidays.add({ date, name, kind, createdAt: clock.now().getTime() });
			recomputeOpenPayDates(repos);
			return id;
		},
		removeHoliday(id) {
			ensure(repos.holidays.remove(id), 'Unknown holiday');
			recomputeOpenPayDates(repos);
		},
		calendar(year = currentYear()) {
			ensure(Number.isInteger(year) && year >= 2000 && year <= 2100, 'Choose a valid year');
			const ids = paydayIds(repos);
			const entries = yearSchedule({
				year,
				rule: repos.settings.get().payRule,
				holidays: repos.holidays.list(),
				overrides: repos.payOverrides.all(),
				locked: lockedPayDates(repos)
			}).map((entry) => ({ ...entry, paydayId: ids.get(entry.scheduledDate) ?? null }));
			return { year, entries };
		},
		setOverride(scheduledDate, payDate) {
			const scheduled = normalizeDate(scheduledDate);
			const actual = normalizeDate(payDate, 'pay date');
			const payday = repos.paydays.findByScheduledDate(scheduled);
			ensure(!payday || !isLockedPayday(payday), 'Received or finished paydays cannot move');
			repos.payOverrides.set(scheduled, actual);
			applyToOpenPayday(repos, scheduled, actual);
		},
		resetOverride(scheduledDate) {
			const scheduled = normalizeDate(scheduledDate);
			const payday = repos.paydays.findByScheduledDate(scheduled);
			ensure(!payday || !isLockedPayday(payday), 'Received or finished paydays cannot move');
			repos.payOverrides.remove(scheduled);
			if (payday) applyToOpenPayday(repos, scheduled, resolvePayDate(repos, scheduled));
		}
	};
}

export { formatDaysOfMonth };
