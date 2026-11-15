import { describe, expect, it } from 'vitest';
import { createTestClock } from '../testing/clock.ts';
import { createMemoryRepositories } from '../testing/memory-repositories.ts';
import { createServices } from '../container.ts';

describe('payday arrival dates', () => {
	it('shifts auto-created pay dates around holidays and weekends', () => {
		const repos = createMemoryRepositories();
		const services = createServices(repos, 'test-passphrase-16c', createTestClock());
		repos.holidays.add({
			date: '2026-10-15',
			name: 'Test Holiday',
			kind: 'NATIONAL',
			createdAt: 1
		});
		services.paydays.ensureUpcoming();
		const mid = services.paydays.listOpen().find((payday) => payday.cadence === 'MID_MONTH')!;
		expect(mid).toMatchObject({ scheduledDate: '2026-10-15', payDate: '2026-10-14' });
		expect(services.paydays.view(mid.id).arrivalNote).toContain('moved from Thu Oct 15');
		expect(services.paydays.view(mid.id).arrivalNote).toContain('holiday: Test Holiday');
	});

	it('keeps a manual override when holidays change, and can reset it', () => {
		const repos = createMemoryRepositories();
		const services = createServices(repos, 'test-passphrase-16c', createTestClock());
		services.paydays.ensureUpcoming();
		const mid = services.paydays.listOpen().find((payday) => payday.cadence === 'MID_MONTH')!;
		services.paydays.setPayDate(mid.id, '2026-10-12');
		repos.holidays.add({
			date: '2026-10-15',
			name: 'Test Holiday',
			kind: 'NATIONAL',
			createdAt: 1
		});
		services.paydays.ensureUpcoming();
		expect(services.paydays.view(mid.id).payday.payDate).toBe('2026-10-12');
		services.paydays.resetPayDate(mid.id);
		expect(services.paydays.view(mid.id).payday.payDate).toBe('2026-10-14');
	});

	it('uses an existing override when creating a payday, and ignores an unknown preferred id', () => {
		const repos = createMemoryRepositories();
		const services = createServices(repos, 'test-passphrase-16c', createTestClock());
		repos.payOverrides.set('2026-10-15', '2026-10-12');
		services.paydays.ensureUpcoming();
		const mid = services.paydays.listOpen().find((payday) => payday.cadence === 'MID_MONTH')!;
		expect(mid.payDate).toBe('2026-10-12');
		expect(services.paydays.active(9999)?.payday.id).toBe(mid.id);
	});

	it('does not move a received payday when holidays are added', () => {
		const repos = createMemoryRepositories();
		const services = createServices(repos, 'test-passphrase-16c', createTestClock());
		services.paydays.ensureUpcoming();
		const mid = services.paydays.listOpen().find((payday) => payday.cadence === 'MID_MONTH')!;
		expect(mid.payDate).toBe('2026-10-15');
		services.paydays.receive(mid.id, '75,000');
		expect(() => services.paydays.setPayDate(mid.id, '2026-10-12')).toThrow(
			'Received or finished paydays cannot move'
		);
		repos.holidays.add({
			date: '2026-10-15',
			name: 'Test Holiday',
			kind: 'NATIONAL',
			createdAt: 1
		});
		services.paydays.ensureUpcoming();
		expect(services.paydays.view(mid.id).payday.payDate).toBe('2026-10-15');
	});
});
