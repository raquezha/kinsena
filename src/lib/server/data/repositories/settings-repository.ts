import { eq } from 'drizzle-orm';
import { DEFAULT_CURRENCY, isCurrencyCode, type CurrencyCode } from '../../../domain/currency.ts';
import type { Settings } from '../../../domain/models.ts';
import { DEFAULT_PAY_RULE, normalizePayRule, type PayRule } from '../../../domain/pay-rule.ts';
import type { SettingsRepository } from '../../ports.ts';
import type { Db } from '../database.ts';
import { settings } from '../schema.ts';

const SETTINGS_ID = 1;

const empty: Settings = {
	currency: DEFAULT_CURRENCY,
	midMonthSalary: null,
	monthEndSalary: null,
	payRule: DEFAULT_PAY_RULE
};

export function createSettingsRepository(db: Db): SettingsRepository {
	const read = (): Settings => {
		const row = db.select().from(settings).where(eq(settings.id, SETTINGS_ID)).get();
		if (!row) return empty;
		return {
			currency: isCurrencyCode(row.currency) ? row.currency : DEFAULT_CURRENCY,
			midMonthSalary: row.midMonthSalary,
			monthEndSalary: row.monthEndSalary,
			payRule: normalizePayRule(row.payRule)
		};
	};

	const upsert = (patch: Partial<Settings>) => {
		const current = read();
		const next = { ...current, ...patch };
		db.insert(settings)
			.values({ id: SETTINGS_ID, ...next })
			.onConflictDoUpdate({ target: settings.id, set: next })
			.run();
	};

	return {
		get: read,
		setCurrency: (currency: CurrencyCode) => upsert({ currency }),
		setSalaries: (midMonthSalary, monthEndSalary) => upsert({ midMonthSalary, monthEndSalary }),
		setPayRule: (payRule: PayRule) => upsert({ payRule: normalizePayRule(payRule) })
	};
}
