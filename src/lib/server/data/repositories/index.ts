import type { Repositories } from '../../ports.ts';
import type { Db } from '../database.ts';
import { createDestinationRepository } from './destination-repository.ts';
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
		settings: createSettingsRepository(db)
	};
}
