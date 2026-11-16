import type { DestinationKind } from './destination.ts';
import { isCatalogIconKey } from './recurring-catalog.ts';
import { isBrandIconValue } from './template-icon.ts';

export type RecurringIcon =
	| 'zap'
	| 'droplet'
	| 'wifi'
	| 'home'
	| 'smartphone'
	| 'creditCard'
	| 'piggyBank'
	| 'wallet'
	| 'gamepad'
	| 'landmark'
	| 'receipt'
	| 'repeat'
	| 'car'
	| 'shoppingBag'
	| 'tv'
	| 'heartPulse'
	| 'graduationCap'
	| 'utensils'
	| 'plane'
	| 'gift'
	| 'shield'
	| 'briefcase'
	| 'baby'
	| 'dog'
	| 'dumbbell'
	| 'wrench';

const KEYWORD_RULES: { keywords: string[]; icon: RecurringIcon }[] = [
	{ keywords: ['electric', 'power', 'utility', 'energy'], icon: 'zap' },
	{ keywords: ['water', 'aqua'], icon: 'droplet' },
	{ keywords: ['internet', 'wifi', 'fiber', 'broadband'], icon: 'wifi' },
	{ keywords: ['rent', 'housing', 'home', 'hoa', 'condo', 'mortgage'], icon: 'home' },
	{ keywords: ['phone', 'mobile', 'postpaid', 'data', 'load'], icon: 'smartphone' },
	{ keywords: ['credit', 'card', 'paylater', 'loan', 'installment'], icon: 'creditCard' },
	{ keywords: ['saving', 'savings', 'emergency', 'stash'], icon: 'piggyBank' },
	{ keywords: ['budget', 'allowance', 'grocery', 'food'], icon: 'wallet' },
	{ keywords: ['game', 'steam', 'netflix', 'spotify', 'sub'], icon: 'gamepad' }
];

/** Picks a category icon from override, title keywords, then destination kind. */
export function getRecurringIcon(
	title: string,
	destinationKind?: DestinationKind | null,
	iconOverride?: string | null
): RecurringIcon {
	if (iconOverride && !isBrandIconValue(iconOverride) && isCatalogIconKey(iconOverride)) {
		return iconOverride as RecurringIcon;
	}
	const normalized = title.toLowerCase();
	for (const rule of KEYWORD_RULES) {
		if (rule.keywords.some((keyword) => normalized.includes(keyword))) return rule.icon;
	}
	if (destinationKind === 'ACCOUNT') return 'landmark';
	if (destinationKind === 'BILLER') return 'receipt';
	return 'repeat';
}
