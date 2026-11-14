import { eq } from 'drizzle-orm';
import { DEFAULT_CURRENCY, isCurrencyCode, type CurrencyCode } from '../../../domain/currency.ts';
import type { SettingsRepository } from '../../ports.ts';
import type { Db } from '../database.ts';
import { settings } from '../schema.ts';

const SETTINGS_ID = 1;

export function createSettingsRepository(db: Db): SettingsRepository {
	return {
		getCurrency(): CurrencyCode {
			const row = db
				.select({ currency: settings.currency })
				.from(settings)
				.where(eq(settings.id, SETTINGS_ID))
				.get();
			const stored = row?.currency ?? DEFAULT_CURRENCY;
			return isCurrencyCode(stored) ? stored : DEFAULT_CURRENCY;
		},
		setCurrency(currency) {
			db.insert(settings)
				.values({ id: SETTINGS_ID, currency })
				.onConflictDoUpdate({ target: settings.id, set: { currency } })
				.run();
		}
	};
}
