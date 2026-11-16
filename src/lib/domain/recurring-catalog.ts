export type CatalogIcon = {
	key: string;
	label: string;
	keywords: string[];
};

/** Primary tiles shown first when search is empty. */
export const PRIMARY_CATALOG_KEYS = [
	'zap',
	'wifi',
	'droplet',
	'home',
	'smartphone',
	'creditCard',
	'landmark',
	'piggyBank',
	'car',
	'shoppingBag',
	'tv',
	'gamepad'
] as const;

export const RECURRING_CATALOG: CatalogIcon[] = [
	{ key: 'zap', label: 'Electric', keywords: ['electric', 'power', 'utility', 'energy'] },
	{ key: 'wifi', label: 'Internet', keywords: ['internet', 'wifi', 'fiber', 'broadband'] },
	{ key: 'droplet', label: 'Water', keywords: ['water', 'aqua', 'utility'] },
	{ key: 'home', label: 'Home', keywords: ['rent', 'housing', 'home', 'hoa', 'condo', 'mortgage'] },
	{ key: 'smartphone', label: 'Phone', keywords: ['phone', 'mobile', 'postpaid', 'data', 'load'] },
	{ key: 'creditCard', label: 'Card', keywords: ['credit', 'card', 'paylater', 'loan'] },
	{ key: 'landmark', label: 'Bank', keywords: ['bank', 'account', 'savings'] },
	{ key: 'piggyBank', label: 'Savings', keywords: ['saving', 'emergency', 'stash'] },
	{ key: 'car', label: 'Transport', keywords: ['car', 'gas', 'fuel', 'parking', 'uber', 'grab'] },
	{ key: 'shoppingBag', label: 'Shopping', keywords: ['shop', 'mall', 'retail', 'store'] },
	{ key: 'tv', label: 'TV', keywords: ['tv', 'cable', 'netflix', 'stream'] },
	{ key: 'gamepad', label: 'Games', keywords: ['game', 'steam', 'playstation', 'xbox'] },
	{ key: 'wallet', label: 'Budget', keywords: ['budget', 'allowance', 'grocery', 'food'] },
	{ key: 'receipt', label: 'Bills', keywords: ['bill', 'receipt', 'invoice'] },
	{ key: 'repeat', label: 'Recurring', keywords: ['recurring', 'subscription', 'sub'] },
	{ key: 'heartPulse', label: 'Health', keywords: ['health', 'medical', 'hospital', 'clinic'] },
	{ key: 'graduationCap', label: 'School', keywords: ['school', 'tuition', 'education'] },
	{ key: 'utensils', label: 'Food', keywords: ['food', 'dining', 'restaurant', 'meal'] },
	{ key: 'plane', label: 'Travel', keywords: ['travel', 'flight', 'plane', 'trip'] },
	{ key: 'gift', label: 'Gift', keywords: ['gift', 'present', 'birthday'] },
	{ key: 'shield', label: 'Insurance', keywords: ['insurance', 'protect', 'shield'] },
	{ key: 'briefcase', label: 'Work', keywords: ['work', 'office', 'job', 'business'] },
	{ key: 'baby', label: 'Kids', keywords: ['baby', 'kids', 'child', 'daycare'] },
	{ key: 'dog', label: 'Pets', keywords: ['pet', 'dog', 'cat', 'vet'] },
	{ key: 'dumbbell', label: 'Fitness', keywords: ['gym', 'fitness', 'workout'] },
	{ key: 'wrench', label: 'Repairs', keywords: ['repair', 'fix', 'maintenance'] }
];

const BY_KEY = new Map(RECURRING_CATALOG.map((entry) => [entry.key, entry]));

export function isCatalogIconKey(value: string): boolean {
	return BY_KEY.has(value);
}

export function catalogIconLabel(key: string): string {
	return BY_KEY.get(key)?.label ?? key;
}

export function filterCatalogIcons(query: string): CatalogIcon[] {
	const q = query.trim().toLowerCase();
	if (!q) {
		const primary = PRIMARY_CATALOG_KEYS.map((key) => BY_KEY.get(key)!);
		const rest = RECURRING_CATALOG.filter(
			(entry) => !(PRIMARY_CATALOG_KEYS as readonly string[]).includes(entry.key)
		);
		return [...primary, ...rest];
	}
	return RECURRING_CATALOG.filter(
		(entry) =>
			entry.key.toLowerCase().includes(q) ||
			entry.label.toLowerCase().includes(q) ||
			entry.keywords.some((keyword) => keyword.includes(q))
	);
}
