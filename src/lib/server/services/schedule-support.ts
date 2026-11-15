import { arrivalReason, payDate } from '../../domain/payday-calendar.ts';
import { isReceived, type Payday } from '../../domain/models.ts';
import type { Repositories } from '../ports.ts';

export type ScheduleRepos = Pick<
	Repositories,
	'paydays' | 'settings' | 'holidays' | 'payOverrides'
>;

export function isLockedPayday(payday: Pick<Payday, 'receivedAt' | 'isClosed'>): boolean {
	return isReceived(payday) || payday.isClosed;
}

export function resolvePayDate(repos: ScheduleRepos, scheduledDate: string): string {
	const override = repos.payOverrides.get(scheduledDate);
	if (override) return override;
	return payDate(scheduledDate, repos.settings.get().payRule, repos.holidays.list());
}

export function arrivalNoteFor(repos: ScheduleRepos, payday: Payday): string | null {
	return arrivalReason(
		payday.scheduledDate,
		payday.payDate,
		repos.settings.get().payRule,
		repos.holidays.list()
	);
}

/** Recompute pay dates for open, unreceived, scheduled (non-OTHER) paydays. */
export function recomputeOpenPayDates(repos: ScheduleRepos): void {
	const rule = repos.settings.get().payRule;
	const holidays = repos.holidays.list();
	const overrides = repos.payOverrides.all();
	for (const payday of repos.paydays.listOpen()) {
		if (isLockedPayday(payday) || payday.cadence === 'OTHER') continue;
		const next = overrides[payday.scheduledDate] ?? payDate(payday.scheduledDate, rule, holidays);
		if (next !== payday.payDate) repos.paydays.update(payday.id, { payDate: next });
	}
}

export function lockedPayDates(repos: ScheduleRepos): Record<string, string> {
	const locked: Record<string, string> = {};
	for (const payday of [...repos.paydays.listOpen(), ...repos.paydays.listClosed()]) {
		if (isLockedPayday(payday)) locked[payday.scheduledDate] = payday.payDate;
	}
	return locked;
}
