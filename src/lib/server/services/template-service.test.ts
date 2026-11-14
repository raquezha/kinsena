import { beforeEach, describe, expect, it } from 'vitest';
import { DomainError } from '../../domain/errors.ts';
import { createTestClock } from '../testing/clock.ts';
import { createMemoryRepositories } from '../testing/memory-repositories.ts';
import type { Repositories } from '../ports.ts';
import { createSettingsService } from './settings-service.ts';
import { createTemplateService, type TemplateService } from './template-service.ts';

describe('template service', () => {
	let repos: Repositories;
	let templates: TemplateService;

	beforeEach(() => {
		repos = createMemoryRepositories();
		templates = createTemplateService(repos.templates, createTestClock());
	});

	it('adds saved items with an optional default amount', () => {
		templates.add({ name: 'Internet', amount: '0.29', cadence: 'ANY' });
		templates.add({ name: 'Variable', amount: '', cadence: 'MID_MONTH' });
		expect(templates.list()).toEqual([
			{ id: 1, name: 'Internet', defaultAmount: 29, cadence: 'ANY' },
			{ id: 2, name: 'Variable', defaultAmount: null, cadence: 'MID_MONTH' }
		]);
	});

	it('validates names and amounts', () => {
		expect(() => templates.add({ name: 'x'.repeat(129), amount: '', cadence: 'ANY' })).toThrow(
			DomainError
		);
		expect(() => templates.add({ name: 'Item', amount: '-1', cadence: 'ANY' })).toThrow(
			DomainError
		);
		expect(templates.list()).toEqual([]);
	});

	it('edits the default amount without inflating it', () => {
		const id = templates.add({ name: 'Rent', amount: '18500.50', cadence: 'ANY' });
		templates.updateAmount(id, '18500.50');
		expect(templates.list()[0]?.defaultAmount).toBe(1_850_050);
		expect(() => templates.updateAmount(id, '2 + nope')).toThrow(DomainError);
		templates.updateAmount(id, '');
		expect(templates.list()[0]?.defaultAmount).toBeNull();
	});

	it('archives saved items and rejects unknown ones', () => {
		const id = templates.add({ name: 'Old', amount: '', cadence: 'ANY' });
		templates.archive(id);
		expect(templates.list()).toEqual([]);
		expect(() => templates.archive(id)).toThrow('Unknown saved item');
		expect(() => templates.updateAmount(id, '1')).toThrow('Unknown saved item');
	});
});

describe('settings service', () => {
	it('stores the currency symbol', () => {
		const settings = createSettingsService(createMemoryRepositories().settings);
		expect(settings.currency()).toBe('PHP');
		settings.setCurrency('USD');
		expect(settings.currency()).toBe('USD');
	});
});
