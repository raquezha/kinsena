import { beforeEach, describe, expect, it } from 'vitest';
import { DomainError } from '../../domain/errors.ts';
import { createTestClock } from '../testing/clock.ts';
import { createMemoryRepositories } from '../testing/memory-repositories.ts';
import { createServices, type Services } from '../container.ts';
import { applyTemplateToUpcoming } from './template-apply.ts';

describe('payday service', () => {
	let services: Services;

	beforeEach(() => {
		services = createServices(createMemoryRepositories(), 'test-passphrase-16c', createTestClock());
	});

	it('auto-creates the next 15th and month-end with default salaries and templates', () => {
		services.settings.setSalaries('75,000', '80,000');
		services.templates.add({
			name: 'Rent',
			amount: '18500.50',
			minimum: '',
			dueDay: '',
			fundFrom: 'EVERY',
			destinationId: null
		});
		services.templates.add({
			name: 'Electric',
			amount: '',
			minimum: '500',
			dueDay: '20',
			fundFrom: 'BEFORE_DUE',
			destinationId: null
		});
		services.templates.add({
			name: 'Internet',
			amount: '0.29',
			minimum: '',
			dueDay: '',
			fundFrom: 'MID_MONTH',
			destinationId: null
		});

		const mid = services.paydays.active();
		expect(mid?.payday).toMatchObject({
			title: 'October 15',
			cadence: 'MID_MONTH',
			scheduledDate: '2026-10-15',
			expectedAmount: 7_500_000,
			receivedAt: null
		});
		expect(mid?.items.map((item) => item.name).sort()).toEqual(['Electric', 'Internet', 'Rent']);
		expect(mid?.items.find((item) => item.name === 'Electric')?.dueDate).toBe('2026-10-20');

		const end = services.paydays.listOpen().find((payday) => payday.cadence === 'MONTH_END');
		expect(end).toMatchObject({ title: 'October 30', expectedAmount: 8_000_000 });
		const endView = services.paydays.view(end!.id);
		expect(endView.items.map((item) => item.name).sort()).toEqual(['Rent']);
	});

	it('does not duplicate a payday that already exists', () => {
		services.paydays.ensureUpcoming();
		const first = services.paydays.listOpen().map((payday) => payday.scheduledDate);
		services.paydays.ensureUpcoming();
		expect(services.paydays.listOpen().map((payday) => payday.scheduledDate)).toEqual(first);
	});

	it('skips a closed payday and opens the following one', () => {
		services.paydays.ensureUpcoming();
		const mid = services.paydays.listOpen().find((payday) => payday.cadence === 'MID_MONTH')!;
		services.paydays.close(mid.id);
		services.paydays.ensureUpcoming();
		expect(services.paydays.listOpen().map((payday) => payday.scheduledDate)).toEqual([
			'2026-10-30',
			'2026-11-15'
		]);
	});

	it('prefers a received payday as the active one', () => {
		services.paydays.ensureUpcoming();
		const end = services.paydays.listOpen().find((payday) => payday.cadence === 'MONTH_END')!;
		services.paydays.setExpected(end.id, '80,000');
		services.paydays.receive(end.id, '');
		expect(services.paydays.active()?.payday.id).toBe(end.id);
		expect(services.paydays.active()?.payday.receivedAmount).toBe(8_000_000);
		expect(services.paydays.active(services.paydays.listOpen()[0]!.id)?.payday.cadence).toBe(
			'MID_MONTH'
		);
	});

	it('marks salary received, saves a note, and finishes into history', () => {
		services.paydays.ensureUpcoming();
		const mid = services.paydays.active()!;
		expect(() => services.paydays.receive(mid.payday.id, '')).toThrow(
			'Enter the salary that arrived'
		);
		services.paydays.receive(mid.payday.id, '75,000.25');
		services.paydays.setNote(mid.payday.id, 'Bonus payout');
		const received = services.paydays.view(mid.payday.id);
		expect(received.payday.receivedAt).toBe('2026-10-15');
		expect(received.payday.receivedAmount).toBe(7_500_025);
		expect(received.summary.salary).toBe(7_500_025);
		services.paydays.close(mid.payday.id);
		expect(services.paydays.active()?.payday.id).not.toBe(mid.payday.id);
		expect(services.paydays.history().reopenableId).toBe(mid.payday.id);
		services.paydays.reopen(mid.payday.id);
		expect(services.paydays.view(mid.payday.id).payday.isClosed).toBe(false);
		services.paydays.close(mid.payday.id);
		const end = services.paydays.listOpen().find((payday) => payday.cadence === 'MONTH_END')!;
		services.paydays.close(end.id);
		expect(() => services.paydays.reopen(mid.payday.id)).toThrow('Only the most recent');
	});

	it('creates an OTHER payday on a custom date', () => {
		const id = services.paydays.createOther({ title: '', date: '2026-11-20', salary: '10,000' });
		expect(services.paydays.view(id).payday).toMatchObject({
			title: 'November 20',
			cadence: 'OTHER',
			expectedAmount: 1_000_000
		});
		expect(() =>
			services.paydays.createOther({ title: 'Again', date: '2026-11-20', salary: '' })
		).toThrow('A payday already exists on that date');
		expect(() =>
			services.paydays.createOther({ title: 'Bad', date: '2026-11-31', salary: '' })
		).toThrow(DomainError);
	});

	it('creates the following payday when none is open after this one', () => {
		services.paydays.ensureUpcoming();
		const end = services.paydays.listOpen().find((payday) => payday.cadence === 'MONTH_END')!;
		const next = services.paydays.nextAfter(end.id);
		expect(next.scheduledDate).toBe('2026-11-15');
		expect(services.paydays.findNext(end.id)?.id).toBe(next.id);
		services.paydays.setPayDate(end.id, '2026-10-30');
		expect(services.paydays.view(end.id).payday.payDate).toBe('2026-10-30');
		services.paydays.setExpected(end.id, '90,000');
		expect(services.paydays.view(end.id).payday.expectedAmount).toBe(9_000_000);
	});

	it('returns an empty history when nothing is finished', () => {
		expect(services.paydays.history()).toEqual({ paydays: [], reopenableId: null });
		expect(() => services.paydays.reopen(1)).toThrow('Only the most recent');
		expect(() => services.paydays.view(999)).toThrow('Unknown payday');
	});

	it('returns null from findNext when no later payday is already open', () => {
		services.paydays.ensureUpcoming();
		const end = services.paydays.listOpen().find((payday) => payday.cadence === 'MONTH_END')!;
		expect(services.paydays.findNext(end.id)).toBeNull();
	});

	it('creates a mid-month payday on the 15th and skips a closed month-end', () => {
		services.paydays.ensureUpcoming();
		const mid = services.paydays.listOpen().find((payday) => payday.cadence === 'MID_MONTH')!;
		const end = services.paydays.listOpen().find((payday) => payday.cadence === 'MONTH_END')!;
		services.paydays.close(end.id);
		const next = services.paydays.nextAfter(mid.id);
		expect(next.scheduledDate).toBe('2026-11-30');
		const laterMid = services.paydays.createOther({
			title: '',
			date: '2026-12-15',
			salary: '10,000'
		});
		expect(services.paydays.view(laterMid).payday.cadence).toBe('MID_MONTH');
	});
});

describe('defaults apply-if-missing', () => {
	it('skips seeding open paydays when applyToOpen is false', () => {
		const services = createServices(createMemoryRepositories(), 'test-passphrase-16c', createTestClock());
		services.paydays.ensureUpcoming();
		const mid = services.paydays.active()!.payday;
		const before = services.paydays.view(mid.id).items.length;
		const id = services.templates.add({
			name: 'Hold back',
			amount: '100',
			minimum: '',
			dueDay: '',
			fundFrom: 'EVERY',
			destinationId: null,
			applyToOpen: false
		});
		expect(services.paydays.view(mid.id).items.some((item) => item.templateId === id)).toBe(false);
		expect(services.paydays.view(mid.id).items).toHaveLength(before);

		const pulled = services.paydays.applyMissingDefaults(mid.id);
		expect(pulled.added).toBe(1);
		expect(pulled.alreadyPresent).toBe(0);
		expect(services.paydays.view(mid.id).items.some((item) => item.templateId === id)).toBe(true);

		const again = services.paydays.applyMissingDefaults(mid.id);
		expect(again).toMatchObject({ added: 0, alreadyPresent: 1 });
	});

	it('does not add missing defaults after salary is received', () => {
		const services = createServices(createMemoryRepositories(), 'test-passphrase-16c', createTestClock());
		services.paydays.ensureUpcoming();
		const mid = services.paydays.active()!.payday;
		services.templates.add({
			name: 'Later',
			amount: '50',
			minimum: '',
			dueDay: '',
			fundFrom: 'EVERY',
			destinationId: null,
			applyToOpen: false
		});
		services.paydays.receive(mid.id, '75,000');
		const result = services.paydays.applyMissingDefaults(mid.id);
		expect(result.added).toBe(0);
		expect(result.skippedByRule).toBeGreaterThan(0);
		expect(services.paydays.view(mid.id).items.some((item) => item.name === 'Later')).toBe(false);
	});
});

describe('applyTemplateToUpcoming', () => {
	it('skips received, already-copied, and non-matching paydays', () => {
		const repos = createMemoryRepositories();
		const services = createServices(repos, 'test-passphrase-16c', createTestClock());
		services.paydays.ensureUpcoming();
		const mid = services.paydays.active()!.payday;
		const end = services.paydays.listOpen().find((payday) => payday.cadence === 'MONTH_END')!;
		const midOnlyId = services.templates.add({
			name: 'Mid-only bill',
			amount: '200',
			minimum: '',
			dueDay: '',
			fundFrom: 'MID_MONTH',
			destinationId: null
		});
		expect(services.paydays.view(mid.id).items.some((item) => item.templateId === midOnlyId)).toBe(
			true
		);
		expect(services.paydays.view(end.id).items.some((item) => item.templateId === midOnlyId)).toBe(
			false
		);
		services.paydays.receive(mid.id, '75,000');

		const monthEndId = services.templates.add({
			name: 'Bonus savings',
			amount: '1,000',
			minimum: '',
			dueDay: '',
			fundFrom: 'MONTH_END',
			destinationId: null
		});
		expect(services.paydays.view(mid.id).items.some((item) => item.name === 'Bonus savings')).toBe(
			false
		);
		expect(services.paydays.view(end.id).items.some((item) => item.name === 'Bonus savings')).toBe(
			true
		);

		const saved = repos.templates.findById(monthEndId);
		expect(saved).not.toBeNull();
		applyTemplateToUpcoming(repos, saved!);
		expect(
			services.paydays.view(end.id).items.filter((item) => item.templateId === monthEndId)
		).toHaveLength(1);

		const closed: typeof mid = { ...end, isClosed: true };
		const add = () => {
			throw new Error('closed payday should be skipped');
		};
		applyTemplateToUpcoming(
			{
				paydays: { listOpen: () => [closed] },
				items: { hasTemplate: () => false, maxSortOrder: () => 0, add }
			} as unknown as Parameters<typeof applyTemplateToUpcoming>[0],
			saved!
		);
	});
});
