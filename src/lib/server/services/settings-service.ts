import { parseOptionalAmount } from '../../domain/amount-parser.ts';
import type { CurrencyCode } from '../../domain/currency.ts';
import type { Settings } from '../../domain/models.ts';
import type { PayRule } from '../../domain/pay-rule.ts';
import { ensureMoney } from '../../domain/rules.ts';
import type { SettingsRepository } from '../ports.ts';

export interface SettingsService {
	get(): Settings;
	currency(): CurrencyCode;
	setCurrency(currency: CurrencyCode): void;
	setSalaries(midMonth: string, monthEnd: string): void;
	setPayRule(rule: PayRule): void;
}

export function createSettingsService(settings: SettingsRepository): SettingsService {
	return {
		get: () => settings.get(),
		currency: () => settings.get().currency,
		setCurrency: (currency) => settings.setCurrency(currency),
		setSalaries(midMonth, monthEnd) {
			const mid = parseOptionalAmount(midMonth);
			const end = parseOptionalAmount(monthEnd);
			ensureMoney(mid, 'mid-month salary');
			ensureMoney(end, 'month-end salary');
			settings.setSalaries(mid, end);
		},
		setPayRule: (rule) => settings.setPayRule(rule)
	};
}
