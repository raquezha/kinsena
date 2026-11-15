import type { Repositories } from '../../ports.ts';
import type { Db } from '../database.ts';
import { createDestinationRepository } from './destination-repository.ts';
import { createHolidayRepository } from './holiday-repository.ts';
import { createPayOverrideRepository } from './pay-override-repository.ts';
import { createPaydayRepository } from './payday-repository.ts';
import { createRouteItemRepository } from './route-item-repository.ts';
import { createSettingsRepository } from './settings-repository.ts';
import { createTemplateRepository } from './template-repository.ts';

export function createSqliteRepositories(db: Db): Repositories {
	return {
		templates: createTemplateRepository(db),
		paydays: createPaydayRepository(db),
		items: createRouteItemRepository(db),
		destinations: createDestinationRepository(db),
		settings: createSettingsRepository(db),
		holidays: createHolidayRepository(db),
		payOverrides: createPayOverrideRepository(db)
	};
}
