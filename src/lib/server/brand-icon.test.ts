import { describe, expect, it } from 'vitest';
import { contrastColor, relativeLuminance, resolveBrandIcon } from './brand-icon.ts';

describe('contrastColor', () => {
	it('lifts near-black brands to warm off-white', () => {
		expect(contrastColor('000000')).toBe('#F3EFE6');
		expect(contrastColor('111111')).toBe('#F3EFE6');
	});

	it('lifts dark navy brands above the dark-card floor', () => {
		const bdo = contrastColor('0038A8');
		expect(relativeLuminance(bdo)).toBeGreaterThanOrEqual(0.18);
		expect(bdo).not.toBe('#0038A8');
	});
});

describe('resolveBrandIcon', () => {
	it('matches universal PH banks as monograms', () => {
		expect(resolveBrandIcon('BDO')).toMatchObject({ kind: 'monogram', label: 'BDO' });
		expect(resolveBrandIcon('BPI')).toMatchObject({ kind: 'monogram', label: 'BPI' });
		expect(resolveBrandIcon('Metrobank')).toMatchObject({ kind: 'monogram', label: 'MBTC' });
		expect(resolveBrandIcon('UnionBank')).toMatchObject({ kind: 'monogram', label: 'UB' });
		expect(resolveBrandIcon('Security Bank')).toMatchObject({
			kind: 'monogram',
			label: 'SBC'
		});
		expect(resolveBrandIcon('Landbank')).toMatchObject({ kind: 'monogram', label: 'LBP' });
		expect(resolveBrandIcon('Chinabank')).toMatchObject({ kind: 'monogram', label: 'CBC' });
		expect(resolveBrandIcon('RCBC')).toMatchObject({ kind: 'monogram', label: 'RCBC' });
		expect(resolveBrandIcon('EastWest')).toMatchObject({ kind: 'monogram', label: 'EWB' });
		expect(resolveBrandIcon('AUB')).toMatchObject({ kind: 'monogram', label: 'AUB' });
	});

	it('matches thrift and rural banks', () => {
		expect(resolveBrandIcon('PSBank')).toMatchObject({ kind: 'monogram', label: 'PSB' });
		expect(resolveBrandIcon('CitySavings')).toMatchObject({ kind: 'monogram', label: 'CSB' });
		expect(resolveBrandIcon('BanKo')).toMatchObject({ kind: 'monogram', label: 'BANKO' });
		expect(resolveBrandIcon('CARD Bank')).toMatchObject({ kind: 'monogram', label: 'CARD' });
		expect(resolveBrandIcon('Cantilan')).toMatchObject({ kind: 'monogram', label: 'CNTLN' });
	});

	it('matches digital banks and local wallets', () => {
		expect(resolveBrandIcon('GoTyme')).toMatchObject({ kind: 'monogram', label: 'GOTYME' });
		expect(resolveBrandIcon('SeaBank')).toMatchObject({ kind: 'monogram', label: 'SEA' });
		expect(resolveBrandIcon('MariBank')).toMatchObject({ kind: 'monogram', label: 'SEA' });
		expect(resolveBrandIcon('CIMB')).toMatchObject({ kind: 'monogram', label: 'CIMB' });
		expect(resolveBrandIcon('Tonik')).toMatchObject({ kind: 'monogram', label: 'TONIK' });
		expect(resolveBrandIcon('UNO')).toMatchObject({ kind: 'monogram', label: 'UNO' });
		expect(resolveBrandIcon('OwnBank')).toMatchObject({ kind: 'monogram', label: 'OWN' });
		expect(resolveBrandIcon('Maya')).toMatchObject({ kind: 'monogram', label: 'MAYA' });
		expect(resolveBrandIcon('GCash')).toMatchObject({ kind: 'monogram', label: 'GCASH' });
	});

	it('matches e-wallets and card networks', () => {
		expect(resolveBrandIcon('Shopee SPayLater')).toMatchObject({
			kind: 'svg',
			color: '#EE4D2D'
		});
		expect(resolveBrandIcon('Lazada PayLater')).toMatchObject({ kind: 'monogram', label: 'LZD' });
		expect(resolveBrandIcon('TikTok PayLater')).toMatchObject({
			kind: 'svg',
			color: '#F3EFE6'
		});
		expect(resolveBrandIcon('Coins.ph')).toMatchObject({ kind: 'monogram', label: 'COINS' });
		expect(resolveBrandIcon('PalawanPay')).toMatchObject({ kind: 'monogram', label: 'PLWN' });
		expect(resolveBrandIcon('Visa')).toMatchObject({ kind: 'svg' });
		expect(resolveBrandIcon('Mastercard')).toMatchObject({ kind: 'svg', color: '#EB001B' });
		expect(resolveBrandIcon('JCB')).toMatchObject({ kind: 'svg' });
	});

	it('keeps resolved colors above the dark-card luminance floor', () => {
		for (const name of ['BDO', 'PNB', 'Visa', 'Lazada', 'JCB', 'TikTok']) {
			const icon = resolveBrandIcon(name);
			expect(icon).not.toBeNull();
			expect(relativeLuminance(icon!.color)).toBeGreaterThanOrEqual(0.18);
		}
	});

	it('matches government and utilities', () => {
		expect(resolveBrandIcon('SSS')).toMatchObject({ kind: 'monogram', label: 'SSS' });
		expect(resolveBrandIcon('Pag-IBIG')).toMatchObject({ kind: 'monogram', label: 'HDMF' });
		expect(resolveBrandIcon('PhilHealth')).toMatchObject({ kind: 'monogram', label: 'PHIC' });
		expect(resolveBrandIcon('Meralco')).toMatchObject({ kind: 'monogram', label: 'MRLC' });
		expect(resolveBrandIcon('Smart Postpaid')).toMatchObject({
			kind: 'monogram',
			label: 'SMART'
		});
	});

	it('returns null for unknown local names', () => {
		expect(resolveBrandIcon('Kyle')).toBeNull();
		expect(resolveBrandIcon('Beta Waters')).toBeNull();
		expect(resolveBrandIcon('Casureco 2')).toBeNull();
	});
});

describe('searchBrandIcons', () => {
	it('finds PH banks and wallets by query', async () => {
		const { searchBrandIcons } = await import('./brand-icon.ts');
		const hits = searchBrandIcons('bdo');
		expect(hits.some((hit) => hit.key === 'bdo')).toBe(true);
		expect(searchBrandIcons('gcash')[0]?.key).toBe('gcash');
		expect(searchBrandIcons('')).toEqual([]);
	});
});
