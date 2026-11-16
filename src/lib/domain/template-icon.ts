/** Persisted icon encoding: null = Auto, category key, or brand:<key>. */
export function isBrandIconValue(value: string): boolean {
	return value.startsWith('brand:') && value.length > 6;
}

export function brandKeyFromIcon(value: string): string | null {
	if (!isBrandIconValue(value)) return null;
	return value.slice(6);
}

export function encodeBrandIcon(key: string): string {
	return `brand:${key}`;
}
