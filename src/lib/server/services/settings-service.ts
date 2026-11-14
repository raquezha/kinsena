import type { CurrencyCode } from '../../domain/currency.ts';
import type { SettingsRepository } from '../ports.ts';

export interface SettingsService {
	currency(): CurrencyCode;
	/** Changes only the symbol; existing amounts are not converted. */
	setCurrency(currency: CurrencyCode): void;
}

export function createSettingsService(settings: SettingsRepository): SettingsService {
	return {
		currency: () => settings.getCurrency(),
		setCurrency: (currency) => settings.setCurrency(currency)
	};
}
