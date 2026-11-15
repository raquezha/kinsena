import { describe, expect, it } from 'vitest';
import { createTestClock } from '../testing/clock.ts';
import { createMemoryRepositories } from '../testing/memory-repositories.ts';
import { createServices } from '../container.ts';
import { parseApprovedLines, parseUndoPayload } from './plan-service.ts';
import { DomainError } from '../../domain/errors.ts';

describe('plan service', () => {
	function setup() {
		const services = createServices(
			createMemoryRepositories(),
			'test-passphrase-16c',
			createTestClock()
		);
		services.destinations.add('Meralco', 'BILLER');
		const meralco = services.destinations.list()[0]!.id;
		services.templates.add({
			name: 'Electricity',
			amount: '',
			minimum: '1,000',
			dueDay: '5',
			fundFrom: 'EVERY',
			destinationId: meralco
		});
		services.templates.add({
			name: 'Rent',
			amount: '12,000',
			minimum: '',
			dueDay: '20',
			fundFrom: 'MID_MONTH',
			destinationId: null
		});
		services.paydays.ensureUpcoming();
		const mid = services.paydays.active()!.payday;
		const electric = services.paydays
			.view(mid.id)
			.items.find((item) => item.name === 'Electricity')!;
		services.items.decide(electric.id, 'CUSTOM', '3,200');
		services.items.toggleDone(electric.id);
		services.paydays.close(mid.id);
		services.paydays.ensureUpcoming();
		const nextMid = services.paydays.listOpen().find((payday) => payday.cadence === 'MID_MONTH')!;
		return { services, mid, nextMid, electric };
	}

	it('prefills last paid amounts and drafts a plan after salary is in', () => {
		const { services, nextMid } = setup();
		services.paydays.receive(nextMid.id, '20,000');
		const plan = services.plans.build(nextMid.id, 'PHP');
		const electric = plan.lines.find((line) => line.name === 'Electricity');
		expect(electric).toMatchObject({
			decision: 'FULL',
			amount: 320_000,
			usedLastPaid: true,
			destinationName: 'Meralco'
		});
		expect(electric?.reason).toMatch(/last paid/);
		expect(plan.total).toBeGreaterThan(0);
		expect(plan.leftover).not.toBeNull();
	});

	it('approves a plan without marking items done, and undoes it', () => {
		const { services, nextMid } = setup();
		services.paydays.receive(nextMid.id, '20,000');
		const plan = services.plans.build(nextMid.id, 'PHP');
		const undo = services.plans.approve(
			nextMid.id,
			plan.lines.map((line) => ({
				itemId: line.itemId,
				decision: line.decision,
				amount: line.amount,
				reason: line.reason
			}))
		);
		const approved = services.paydays
			.view(nextMid.id)
			.items.find((item) => item.name === 'Electricity')!;
		expect(approved).toMatchObject({
			decision: 'FULL',
			chosenAmount: 320_000,
			isDone: false
		});
		expect(approved.decisionReason).toMatch(/last paid/);
		services.plans.restore(undo, (removed) => services.items.restore(removed));
		expect(
			services.paydays.view(nextMid.id).items.find((item) => item.name === 'Electricity')
		).toMatchObject({ decision: 'PENDING', chosenAmount: 0, decisionReason: null });
	});

	it('lists pending, undone, and skipped items in the finish check', () => {
		const { services, nextMid } = setup();
		services.paydays.receive(nextMid.id, '50,000');
		const rent = services.paydays.view(nextMid.id).items.find((item) => item.name === 'Rent')!;
		const electric = services.paydays
			.view(nextMid.id)
			.items.find((item) => item.name === 'Electricity')!;
		services.items.decide(rent.id, 'FULL');
		services.items.skip(electric.id, false);
		const issues = services.plans.finishIssues(nextMid.id);
		expect(issues.map((issue) => `${issue.name}:${issue.kind}`).sort()).toEqual(
			['Electricity:skipped', 'Rent:undone'].sort()
		);
		const leftover = services.items.add({
			paydayId: nextMid.id,
			name: 'Unplanned',
			amount: '100',
			minimum: '',
			dueDate: '',
			destinationId: null
		});
		expect(services.plans.finishIssues(nextMid.id).some((issue) => issue.itemId === leftover)).toBe(
			true
		);
	});

	it('restores a deleted item from an undo payload', () => {
		const { services, nextMid } = setup();
		const rent = services.paydays.view(nextMid.id).items.find((item) => item.name === 'Rent')!;
		const removed = services.items.remove(rent.id);
		services.plans.restore({ kind: 'removed', removed }, (item) => services.items.restore(item));
		expect(services.paydays.view(nextMid.id).items.some((item) => item.name === 'Rent')).toBe(true);
	});

	it('refuses to approve before salary is in, and rejects a bad plan', () => {
		const { services, nextMid } = setup();
		expect(() => services.plans.approve(nextMid.id, [])).toThrow('Mark salary as received first');
		services.paydays.receive(nextMid.id, '20,000');
		expect(() =>
			services.plans.approve(nextMid.id, [
				{ itemId: 9999, decision: 'FULL', amount: 1, reason: 'x' }
			])
		).toThrow('Unknown item');
		expect(() => parseApprovedLines('nope')).toThrow(DomainError);
		expect(() => parseUndoPayload({ kind: 'items', items: [] })).toThrow('Nothing to undo');
	});

	it('builds a skipped plan when salary has not been received', () => {
		const { services, nextMid } = setup();
		const plan = services.plans.build(nextMid.id, 'PHP');
		expect(plan.leftover).toBeNull();
		expect(plan.lines.every((line) => line.decision === 'SKIPPED')).toBe(true);
	});
});
