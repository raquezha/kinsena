import { DEFAULT_CURRENCY, type CurrencyCode } from '../../domain/currency.ts';
import type { Cycle, CycleItem, TemplateItem } from '../../domain/models.ts';
import type {
	CycleRepository,
	ItemRepository,
	Repositories,
	SettingsRepository,
	TemplateRepository
} from '../ports.ts';

type StoredTemplate = TemplateItem & { isArchived: boolean };

function patchRow<T extends { id: number }>(rows: T[], id: number, patch: Partial<T>): boolean {
	const row = rows.find((entry) => entry.id === id);
	if (!row || Object.keys(patch).length === 0) return false;
	Object.assign(row, patch);
	return true;
}

function memoryTemplates(): TemplateRepository {
	const rows: StoredTemplate[] = [];
	const active = (id: number) => rows.find((row) => row.id === id && !row.isArchived);
	return {
		listActive: () =>
			rows
				.filter((row) => !row.isArchived)
				.sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id)
				.map(({ id, name, defaultAmount, cadence }) => ({ id, name, defaultAmount, cadence })),
		add(template) {
			const id = rows.length + 1;
			const { name, defaultAmount, cadence } = template;
			rows.push({ id, name, defaultAmount, cadence, isArchived: false });
			return id;
		},
		updateAmount: (id, amount) =>
			active(id) ? patchRow(rows, id, { defaultAmount: amount }) : false,
		archive: (id) => (active(id) ? patchRow(rows, id, { isArchived: true }) : false)
	};
}

function memoryCyclesAndItems(): Pick<Repositories, 'cycles' | 'items'> {
	const cycleRows: Cycle[] = [];
	const itemRows: CycleItem[] = [];
	const copy = <T>(row: T | undefined) => (row ? { ...row } : null);
	const byNewest = () => [...cycleRows].sort((a, b) => b.id - a.id);
	let nextItemId = 1;

	const items: ItemRepository = {
		findById: (id) => copy(itemRows.find((row) => row.id === id)),
		listByCycle: (cycleId) =>
			itemRows
				.filter((row) => row.cycleId === cycleId)
				.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
				.map((row) => ({ ...row })),
		add(cycleId, item) {
			const id = nextItemId++;
			itemRows.push({ ...item, id, cycleId });
			return id;
		},
		update: (id, patch) => patchRow(itemRows, id, patch),
		remove(id) {
			const index = itemRows.findIndex((row) => row.id === id);
			if (index >= 0) itemRows.splice(index, 1);
			return index >= 0;
		},
		removeByCycle(cycleId) {
			const before = itemRows.length;
			const kept = itemRows.filter((row) => row.cycleId !== cycleId);
			itemRows.splice(0, itemRows.length, ...kept);
			return before - kept.length;
		},
		maxSortOrder: (cycleId) =>
			Math.max(-1, ...itemRows.filter((row) => row.cycleId === cycleId).map((row) => row.sortOrder))
	};

	const cycles: CycleRepository = {
		findOpen: () => copy(byNewest().find((row) => !row.isClosed)),
		findLatest: () => copy(byNewest()[0]),
		findById: (id) => copy(cycleRows.find((row) => row.id === id)),
		listClosed: () => byNewest().filter((row) => row.isClosed),
		create(cycle, newItems) {
			const id = cycleRows.length + 1;
			const { title, date, salary, note } = cycle;
			cycleRows.push({ id, title, date, salary, note, isClosed: false });
			newItems.forEach((item) => items.add(id, item));
			return id;
		},
		update: (id, patch) => patchRow(cycleRows, id, patch)
	};
	return { cycles, items };
}

function memorySettings(): SettingsRepository {
	let currency: CurrencyCode = DEFAULT_CURRENCY;
	return {
		getCurrency: () => currency,
		setCurrency: (next) => {
			currency = next;
		}
	};
}

/** In-memory repositories with the same contract as the SQLite ones. */
export function createMemoryRepositories(): Repositories {
	return { templates: memoryTemplates(), ...memoryCyclesAndItems(), settings: memorySettings() };
}
