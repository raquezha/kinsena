import type { Repositories } from '../../ports.ts';
import type { Db } from '../database.ts';
import { createCycleRepository } from './cycle-repository.ts';
import { createItemRepository } from './item-repository.ts';
import { createSettingsRepository } from './settings-repository.ts';
import { createTemplateRepository } from './template-repository.ts';

export function createSqliteRepositories(db: Db): Repositories {
	return {
		templates: createTemplateRepository(db),
		cycles: createCycleRepository(db),
		items: createItemRepository(db),
		settings: createSettingsRepository(db)
	};
}
