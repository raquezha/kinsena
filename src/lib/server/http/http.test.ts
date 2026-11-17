import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { DomainError } from '../../domain/errors.ts';
import { attempt, formAction } from './actions.ts';
import type { Services } from '../container.ts';
import { fields, readForm } from './forms.ts';
import { isCrossSiteChange, isPublicPath, isSafeMethod } from './request-guards.ts';
import { hostnameOf, needsSecureCookie, sessionCookieOptions } from './session-cookie.ts';

describe('request guards', () => {
	it('rejects changes from other origins only', () => {
		expect(isCrossSiteChange('POST', 'https://other.example', 'kinsena.example')).toBe(true);
		expect(isCrossSiteChange('POST', 'https://kinsena.example', 'KINSENA.example')).toBe(false);
		expect(isCrossSiteChange('POST', 'not a url', 'kinsena.example')).toBe(true);
		expect(isCrossSiteChange('POST', null, 'kinsena.example')).toBe(false);
		expect(isCrossSiteChange('GET', 'https://other.example', 'kinsena.example')).toBe(false);
		expect(isCrossSiteChange('POST', 'http://127.0.0.1:8080', null)).toBe(true);
	});

	it('knows public paths and safe methods', () => {
		expect(isPublicPath('/login')).toBe(true);
		expect(isPublicPath('/history')).toBe(false);
		expect(isSafeMethod('HEAD')).toBe(true);
		expect(isSafeMethod('POST')).toBe(false);
	});
});

describe('session cookie', () => {
	it('is Secure for every host except loopback and tailnet IPs', () => {
		expect(needsSecureCookie('private.example')).toBe(true);
		expect(needsSecureCookie('kinsena.tailnet.ts.net')).toBe(true);
		expect(needsSecureCookie('192.168.1.10:8080')).toBe(true);
		expect(needsSecureCookie('100.200.1.1')).toBe(true);
		expect(needsSecureCookie('localhost:8080')).toBe(false);
		expect(needsSecureCookie('127.0.0.1')).toBe(false);
		expect(needsSecureCookie('[::1]:8080')).toBe(false);
		expect(needsSecureCookie('100.101.102.103:8081')).toBe(false);
		expect(needsSecureCookie(null)).toBe(true);
	});

	it('is HTTP-only, strict and lasts seven days', () => {
		expect(sessionCookieOptions('localhost')).toEqual({
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			secure: false,
			maxAge: 604_800
		});
		expect(hostnameOf('Example.COM:443')).toBe('example.com');
	});

	it('keeps production and non-production cookie names apart', async () => {
		const { SESSION_COOKIE: name } = await import('./session-cookie.ts');
		expect(name).toBe(
			process.env.NODE_ENV === 'production' ? 'kinsena_session' : 'kinsena_session_dev'
		);
	});
});

describe('forms', () => {
	const post = (body: Record<string, string>) =>
		new Request('http://localhost/', { method: 'POST', body: new URLSearchParams(body) });

	it('reads and validates fields', async () => {
		const form = await readForm(post({ id: '7', amount: '1 + 2', flag: 'true' }), {
			id: fields.id,
			amount: fields.amount,
			fundFrom: fields.fundFrom,
			flag: fields.flag
		});
		expect(form).toEqual({ id: 7, amount: '1 + 2', fundFrom: 'BEFORE_DUE', flag: true });
	});

	it('parses optional ids and integer cents', async () => {
		const form = await readForm(post({ destinationId: '4', minimumAmount: '2500' }), {
			destinationId: fields.optionalId,
			minimumAmount: fields.cents
		});
		expect(form).toEqual({ destinationId: 4, minimumAmount: 2500 });
		expect(
			await readForm(post({}), { destinationId: fields.optionalId, minimumAmount: fields.cents })
		).toEqual({ destinationId: null, minimumAmount: null });
		expect(
			await readForm(post({ minimumAmount: 'null' }), { minimumAmount: fields.cents })
		).toEqual({ minimumAmount: null });
	});

	it('normalizes icon Auto blanks and keeps category keys', async () => {
		expect(await readForm(post({ icon: 'auto' }), { icon: fields.icon })).toEqual({ icon: null });
		expect(await readForm(post({ icon: '  ' }), { icon: fields.icon })).toEqual({ icon: null });
		expect(await readForm(post({ icon: 'zap' }), { icon: fields.icon })).toEqual({ icon: 'zap' });
	});

	it('rejects malformed input', async () => {
		await expect(readForm(post({ id: 'abc' }), { id: fields.id })).rejects.toThrow(DomainError);
		await expect(
			readForm(post({ currency: 'XXX' }), { currency: fields.currency })
		).rejects.toThrow('Check the form');
		await expect(
			readForm(post({ destinationId: '0' }), { destinationId: fields.optionalId })
		).rejects.toThrow('Check the form');
		await expect(
			readForm(post({ minimumAmount: '-1' }), { minimumAmount: fields.cents })
		).rejects.toThrow('Check the form');
	});

	it('ignores file fields', async () => {
		const body = new FormData();
		body.set('name', 'Rent');
		body.set('upload', new Blob(['x']), 'x.txt');
		const request = new Request('http://localhost/', { method: 'POST', body });
		expect(await readForm(request, { name: fields.name, upload: z.string().optional() })).toEqual({
			name: 'Rent'
		});
	});

	it('parses JSON or rejects a broken payload', async () => {
		expect(await readForm(post({ plan: '{"ok":true}' }), { plan: fields.json })).toEqual({
			plan: { ok: true }
		});
		await expect(readForm(post({ plan: 'not-json' }), { plan: fields.json })).rejects.toThrow(
			DomainError
		);
	});
});

describe('attempt', () => {
	it('returns results, converts rule errors and rethrows the rest', async () => {
		expect(await attempt(() => 42)).toBe(42);
		expect(
			await attempt(() => {
				throw new DomainError('Nope');
			})
		).toMatchObject({ status: 400, data: { error: 'Nope' } });
		await expect(
			attempt(() => {
				throw new Error('boom');
			})
		).rejects.toThrow('boom');
	});
});

describe('formAction', () => {
	it('validates the form before running the use case', async () => {
		const services = { settings: { currency: () => 'PHP' } } as unknown as Services;
		const action = formAction(
			{ id: fields.id },
			(form, deps) => `${form.id} ${deps.settings.currency()}`
		);
		const request = (id: string) =>
			new Request('http://localhost/', { method: 'POST', body: new URLSearchParams({ id }) });
		expect(await action({ request: request('3'), locals: { services } as App.Locals })).toBe(
			'3 PHP'
		);
		expect(
			await action({ request: request('x'), locals: { services } as App.Locals })
		).toMatchObject({
			status: 400
		});
	});
});
