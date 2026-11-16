import * as simpleIcons from 'simple-icons';
import type { ResolvedBrandIcon } from '../domain/brand-icon.ts';
import { ALIASES, LOCAL_BRAND_REGISTRY, STOP_WORDS, type LocalBrand } from './brand-icon-roster.ts';

export type { ResolvedBrandIcon } from '../domain/brand-icon.ts';
export type BrandIcon = ResolvedBrandIcon;

type SvgBrand = { path: string; hex: string };

const SIMPLE_ICON_MAP = buildSimpleIconMap();

function buildSimpleIconMap(): Map<string, SvgBrand> {
	const map = new Map<string, SvgBrand>();
	for (const value of Object.values(simpleIcons)) {
		if (!value || typeof value !== 'object' || !('slug' in value) || !('path' in value)) continue;
		const icon = value as { slug: string; title: string; path: string; hex: string };
		const slug = icon.slug.toLowerCase();
		if (slug.length >= 3) map.set(slug, { path: icon.path, hex: icon.hex });
		const titleKey = icon.title.toLowerCase().replace(/[^a-z0-9]/g, '');
		if (titleKey.length >= 3) map.set(titleKey, { path: icon.path, hex: icon.hex });
	}
	return map;
}

function parseHex(hex: string): { r: number; g: number; b: number } {
	const raw = hex.replace('#', '');
	const full = raw.length === 3 ? raw.replace(/(.)/g, '$1$1') : raw;
	const n = Number.parseInt(full, 16);
	return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function channelToLinear(c: number): number {
	const s = c / 255;
	return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
	const { r, g, b } = parseHex(hex);
	return 0.2126 * channelToLinear(r) + 0.7152 * channelToLinear(g) + 0.0722 * channelToLinear(b);
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
	const R = r / 255;
	const G = g / 255;
	const B = b / 255;
	const max = Math.max(R, G, B);
	const min = Math.min(R, G, B);
	const l = (max + min) / 2;
	if (max === min) return { h: 0, s: 0, l };
	const d = max - min;
	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
	const h =
		max === R
			? ((G - B) / d + (G < B ? 6 : 0)) / 6
			: max === G
				? ((B - R) / d + 2) / 6
				: ((R - G) / d + 4) / 6;
	return { h, s, l };
}

function hslToHex(h: number, s: number, l: number): string {
	const hue2rgb = (p: number, q: number, t: number) => {
		let T = t;
		if (T < 0) T += 1;
		if (T > 1) T -= 1;
		if (T < 1 / 6) return p + (q - p) * 6 * T;
		if (T < 1 / 2) return q;
		if (T < 2 / 3) return p + (q - p) * (2 / 3 - T) * 6;
		return p;
	};
	const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	const p = 2 * l - q;
	const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
	const g = Math.round(hue2rgb(p, q, h) * 255);
	const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);
	return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).toUpperCase()}`;
}

/** Near-black → warm off-white; dark navy → luminous cobalt (L >= 0.18). */
export function contrastColor(hex: string): string {
	const { r, g, b } = parseHex(hex);
	const { h, s, l: lHsl } = rgbToHsl(r, g, b);
	const L = relativeLuminance(hex);

	if (s < 0.15 && lHsl < 0.75) return '#F3EFE6';
	if (L >= 0.14) return `#${hex.replace('#', '').toUpperCase()}`;

	const sat = Math.max(s, 0.75);
	let lightness = Math.max(lHsl, 0.58);
	let color = hslToHex(h, sat, lightness);
	while (relativeLuminance(color) < 0.18 && lightness < 0.78) {
		lightness += 0.03;
		color = hslToHex(h, sat, lightness);
	}
	return color;
}

function lookup(
	key: string
): { kind: 'local'; brand: LocalBrand } | { kind: 'svg'; brand: SvgBrand } | null {
	const aliased = ALIASES[key] ?? key;
	const local = LOCAL_BRAND_REGISTRY[aliased];
	if (local) return { kind: 'local', brand: local };
	const svg = SIMPLE_ICON_MAP.get(aliased);
	if (svg) return { kind: 'svg', brand: svg };
	return null;
}

function candidatesFor(name: string): string[] {
	const parts = name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, ' ')
		.trim()
		.split(/\s+/)
		.filter(Boolean);
	const out: string[] = [];
	for (let i = parts.length; i >= 1; i -= 1) {
		const joined = parts.slice(0, i).join('');
		if (joined.length >= 3) out.push(joined);
	}
	for (const part of parts) {
		if (part.length >= 3 && !STOP_WORDS.has(part)) out.push(part);
	}
	return out;
}

export type BrandMatch = {
	key: string;
	name: string;
	brandIcon: ResolvedBrandIcon;
};

export function resolveBrandMatch(name: string): BrandMatch | null {
	for (const key of candidatesFor(name)) {
		const hit = lookup(key);
		if (!hit) continue;
		const color = contrastColor(hit.brand.hex);
		const brandIcon: ResolvedBrandIcon =
			hit.kind === 'local'
				? { kind: 'monogram', label: hit.brand.label, color }
				: { kind: 'svg', path: hit.brand.path, color };
		const label = hit.kind === 'local' ? hit.brand.label : key;
		return { key: ALIASES[key] ?? key, name: brandDisplayName(key, label), brandIcon };
	}
	return null;
}

export function resolveBrandIcon(name: string): ResolvedBrandIcon | null {
	return resolveBrandMatch(name)?.brandIcon ?? null;
}

export function isKnownBrandKey(key: string): boolean {
	const aliased = ALIASES[key] ?? key;
	return Boolean(LOCAL_BRAND_REGISTRY[aliased] || SIMPLE_ICON_MAP.get(aliased));
}

export type BrandSearchHit = {
	key: string;
	name: string;
	brandIcon: ResolvedBrandIcon;
};

const SI_SEARCH_KEYS = [
	'shopee',
	'tiktok',
	'visa',
	'mastercard',
	'jcb',
	'grab',
	'americanexpress',
	'paypal'
] as const;

const DISPLAY_NAMES: Record<string, string> = {
	gcash: 'GCash',
	gotyme: 'GoTyme',
	pagibig: 'Pag-IBIG',
	philhealth: 'PhilHealth',
	homecredit: 'Home Credit',
	securitybank: 'Security Bank',
	unionbank: 'UnionBank',
	chinabank: 'Chinabank',
	landbank: 'Landbank',
	metrobank: 'Metrobank',
	eastwest: 'EastWest',
	psbank: 'PSBank',
	seabank: 'SeaBank',
	coinsph: 'Coins.ph',
	palawanpay: 'PalawanPay',
	americanexpress: 'Amex'
};

function brandDisplayName(key: string, label: string): string {
	return DISPLAY_NAMES[key] ?? (label.length <= 6 ? label : key.toUpperCase());
}

/** Search PH roster + a few global SI brands for the icon picker. */
export function searchBrandIcons(query: string, limit = 24): BrandSearchHit[] {
	const q = query.trim().toLowerCase();
	if (!q) return [];
	const hits: BrandSearchHit[] = [];
	const seen = new Set<string>();

	const push = (key: string, name: string, brandIcon: ResolvedBrandIcon) => {
		if (seen.has(key) || hits.length >= limit) return;
		seen.add(key);
		hits.push({ key, name, brandIcon });
	};

	for (const [key, brand] of Object.entries(LOCAL_BRAND_REGISTRY)) {
		const name = brandDisplayName(key, brand.label);
		if (
			key.includes(q) ||
			name.toLowerCase().includes(q) ||
			brand.label.toLowerCase().includes(q)
		) {
			push(key, name, {
				kind: 'monogram',
				label: brand.label,
				color: contrastColor(brand.hex)
			});
		}
	}

	for (const key of SI_SEARCH_KEYS) {
		if (hits.length >= limit) break;
		const svg = SIMPLE_ICON_MAP.get(key);
		if (!svg) continue;
		const name = brandDisplayName(key, key);
		if (key.includes(q) || name.toLowerCase().includes(q)) {
			push(key, name, { kind: 'svg', path: svg.path, color: contrastColor(svg.hex) });
		}
	}

	return hits;
}
