import { describe, expect, it } from 'vitest';
import { DomainError } from '../../domain/errors.ts';
import { DEFAULT_PAY_RULE } from '../../domain/pay-rule.ts';
import { createTestClock } from '../testing/clock.ts';
import { createMemoryRepositories } from '../testing/memory-repositories.ts';
import { createServices } from '../container.ts';

function setup() {
	const repos = createMemoryRepositories();
	const services = createServices(repos, 'test-passphrase-16c', createTestClock());
	return { repos, services };
}

describe('schedule service', () => {
	it('builds a 24-entry year calendar from the default rule', () => {
		const { services, repos } = setup();
		repos.holidays.add({
			date: '2026-11-30',
			name: 'Bonifacio Day',
			kind: 'NATIONAL',
			createdAt: 1
		});
		const { year, entries } = services.schedule.calendar();
		expect(year).toBe(2026);
		expect(entries).toHaveLength(24);
		const mid = entries.find((entry) => entry.scheduledDate === '2026-11-15');
		const end = entries.find((entry) => entry.scheduledDate === '2026-11-30');
		expect(mid).toMatchObject({ payDate: '2026-11-13', overridden: false, locked: false });
		expect(mid?.reason).toContain('weekend');
		expect(end).toMatchObject({ payDate: '2026-11-27' });
		expect(end?.reason).toContain('Bonifacio Day');
	});

	it('recomputes upcoming paydays when the rule or holidays change', () => {
		const { services } = setup();
		services.paydays.ensureUpcoming();
		const mid = services.paydays.listOpen().find((payday) => payday.cadence === 'MID_MONTH')!;
		expect(mid.payDate).toBe('2026-10-15');
		services.schedule.addHoliday({
			date: '2026-10-15',
			name: 'Local fiesta',
			kind: 'LOCAL'
		});
		expect(services.paydays.view(mid.id).payday.payDate).toBe('2026-10-14');
		services.schedule.setPayRule({
			daysOfMonth: '10, 25',
			shift: 'NEXT',
			weekendDays: '0,6',
			includeNationalHolidays: true,
			includeLocalHolidays: true
		});
		expect(services.schedule.rule().daysOfMonth).toEqual([10, 25]);
		expect(services.schedule.rule().shift).toBe('NEXT');
		const open = services.paydays.listOpen().map((payday) => payday.scheduledDate);
		expect(open).toEqual(['2026-10-15', '2026-10-30']);
		expect(services.paydays.view(mid.id).payday.payDate).toBe('2026-10-16');
	});

	it('keeps overrides through a recompute and restores the computed date on reset', () => {
		const { services } = setup();
		services.paydays.ensureUpcoming();
		const mid = services.paydays.listOpen().find((payday) => payday.cadence === 'MID_MONTH')!;
		services.schedule.setOverride('2026-10-15', '2026-10-12');
		expect(services.paydays.view(mid.id).payday.payDate).toBe('2026-10-12');
		const row = services.schedule
			.calendar(2026)
			.entries.find((entry) => entry.scheduledDate === '2026-10-15');
		expect(row).toMatchObject({ payDate: '2026-10-12', overridden: true, paydayId: mid.id });
		expect(row?.reason).toContain('adjusted from');
		services.schedule.addHoliday({
			date: '2026-10-15',
			name: 'Local fiesta',
			kind: 'LOCAL'
		});
		expect(services.paydays.view(mid.id).payday.payDate).toBe('2026-10-12');
		services.schedule.resetOverride('2026-10-15');
		expect(services.paydays.view(mid.id).payday.payDate).toBe('2026-10-14');
		expect(
			services.schedule.calendar(2026).entries.find((entry) => entry.scheduledDate === '2026-10-15')
				?.overridden
		).toBe(false);
	});

	it('never moves received or finished paydays and rejects overrides on them', () => {
		const { services } = setup();
		services.paydays.ensureUpcoming();
		const mid = services.paydays.listOpen().find((payday) => payday.cadence === 'MID_MONTH')!;
		const end = services.paydays.listOpen().find((payday) => payday.cadence === 'MONTH_END')!;
		services.paydays.receive(mid.id, '75,000');
		services.paydays.close(end.id);
		expect(() => services.schedule.setOverride('2026-10-15', '2026-10-12')).toThrow(
			'Received or finished paydays cannot move'
		);
		expect(() => services.schedule.resetOverride('2026-10-30')).toThrow(
			'Received or finished paydays cannot move'
		);
		services.schedule.addHoliday({
			date: '2026-10-15',
			name: 'Local fiesta',
			kind: 'LOCAL'
		});
		expect(services.paydays.view(mid.id).payday.payDate).toBe('2026-10-15');
		expect(services.paydays.view(end.id).payday.payDate).toBe('2026-10-30');
		const midRow = services.schedule
			.calendar(2026)
			.entries.find((entry) => entry.scheduledDate === '2026-10-15');
		expect(midRow).toMatchObject({ payDate: '2026-10-15', locked: true });
	});

	it('adds and removes holidays, and rejects bad input', () => {
		const { services } = setup();
		const id = services.schedule.addHoliday({
			date: '2026-11-20',
			name: 'City fiesta',
			kind: 'LOCAL'
		});
		expect(services.schedule.holidays()).toEqual([
			{ id, date: '2026-11-20', name: 'City fiesta', kind: 'LOCAL' }
		]);
		expect(() =>
			services.schedule.addHoliday({ date: '2026-11-20', name: 'City fiesta', kind: 'LOCAL' })
		).toThrow('already on the list');
		expect(() =>
			services.schedule.addHoliday({ date: '2026-11-21', name: 'X', kind: 'REGIONAL' })
		).toThrow('Choose national or local');
		expect(() =>
			services.schedule.setPayRule({
				daysOfMonth: '15',
				shift: 'PREVIOUS',
				weekendDays: '0,6',
				includeNationalHolidays: true,
				includeLocalHolidays: true
			})
		).toThrow(DomainError);
		expect(() =>
			services.schedule.setPayRule({
				daysOfMonth: '15, 30',
				shift: 'PREVIOUS',
				weekendDays: '9',
				includeNationalHolidays: true,
				includeLocalHolidays: true
			})
		).toThrow(DomainError);
		services.schedule.removeHoliday(id);
		expect(services.schedule.holidays()).toEqual([]);
		expect(() => services.schedule.removeHoliday(id)).toThrow('Unknown holiday');
		expect(() => services.schedule.calendar(1999)).toThrow('Choose a valid year');
		expect(services.schedule.rule()).toEqual(DEFAULT_PAY_RULE);
		services.settings.setPayRule({ ...DEFAULT_PAY_RULE, shift: 'NEXT' });
		expect(services.settings.get().payRule.shift).toBe('NEXT');
	});

	it('records an override for a date without a payday, including a no-op save', () => {
		const { services } = setup();
		services.paydays.ensureUpcoming();
		const mid = services.paydays.listOpen().find((payday) => payday.cadence === 'MID_MONTH')!;
		services.schedule.setOverride('2026-10-15', mid.payDate);
		expect(services.paydays.view(mid.id).payday.payDate).toBe(mid.payDate);
		services.schedule.setOverride('2026-12-30', '2026-12-28');
		const row = services.schedule
			.calendar(2026)
			.entries.find((entry) => entry.scheduledDate === '2026-12-30');
		expect(row).toMatchObject({ payDate: '2026-12-28', overridden: true, paydayId: null });
		services.schedule.resetOverride('2026-12-30');
		expect(
			services.schedule.calendar(2026).entries.find((entry) => entry.scheduledDate === '2026-12-30')
				?.overridden
		).toBe(false);
	});

	it('can ignore local holidays and treat only Sunday as a weekend', () => {
		const { services } = setup();
		services.schedule.addHoliday({
			date: '2026-10-15',
			name: 'City fiesta',
			kind: 'LOCAL'
		});
		services.schedule.setPayRule({
			daysOfMonth: '15, 30',
			shift: 'PREVIOUS',
			weekendDays: '0',
			includeNationalHolidays: true,
			includeLocalHolidays: false
		});
		const mid = services.schedule
			.calendar(2026)
			.entries.find((entry) => entry.scheduledDate === '2026-10-15');
		expect(mid?.payDate).toBe('2026-10-15');
	});
});
