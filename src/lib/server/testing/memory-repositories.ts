import type { ActivityEvent } from '../../domain/activity.ts';
import { DEFAULT_CURRENCY, type CurrencyCode } from '../../domain/currency.ts';
import type {
	Destination,
	Holiday,
	Payday,
	RouteItem,
	Settings,
	TemplateItem
} from '../../domain/models.ts';
import { DEFAULT_PAY_RULE, normalizePayRule, type PayRule } from '../../domain/pay-rule.ts';
import type {
	ActivityEventRepository,
	DestinationRepository,
	HolidayRepository,
	PaydayRepository,
	PayOverrideRepository,
	Repositories,
	RouteItemRepository,
	SettingsRepository,
	TemplateRepository
} from '../ports.ts';

type StoredTemplate = TemplateItem & { isArchived: boolean };
type StoredDestination = Destination & { isArchived: boolean };

function patchRow<T extends { id: number }>(rows: T[], id: number, patch: Partial<T>): boolean {
	const row = rows.find((entry) => entry.id === id);
	if (!row || Object.keys(patch).length === 0) return false;
	Object.assign(row, patch);
	return true;
}

function copy<T>(row: T | undefined): T | null {
	return row ? { ...row } : null;
}

function memoryTemplates(): TemplateRepository {
	const rows: StoredTemplate[] = [];
	const active = (id: number) => rows.find((row) => row.id === id && !row.isArchived);
	const publicOf = ({
		id,
		name,
		defaultAmount,
		minimumAmount,
		dueDay,
		fundFrom,
		destinationId,
		installmentCount,
		installmentsCompleted,
		isActive,
		icon
	}: StoredTemplate): TemplateItem => ({
		id,
		name,
		defaultAmount,
		minimumAmount,
		dueDay,
		fundFrom,
		destinationId,
		installmentCount,
		installmentsCompleted,
		isActive,
		icon
	});
	return {
		listActive: () =>
			rows
				.filter((row) => !row.isArchived)
				.sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id)
				.map(publicOf),
		findById: (id) => {
			const row = active(id);
			return row ? publicOf(row) : null;
		},
		add(template) {
			const id = rows.length + 1;
			const {
				name,
				defaultAmount,
				minimumAmount,
				dueDay,
				fundFrom,
				destinationId,
				installmentCount,
				installmentsCompleted,
				isActive,
				icon
			} = template;
			rows.push({
				id,
				name,
				defaultAmount,
				minimumAmount,
				dueDay,
				fundFrom,
				destinationId,
				installmentCount,
				installmentsCompleted,
				isActive,
				icon: icon ?? null,
				isArchived: false
			});
			return id;
		},
		update: (id, patch) => (active(id) ? patchRow<StoredTemplate>(rows, id, patch) : false),
		archive: (id) => (active(id) ? patchRow(rows, id, { isArchived: true }) : false)
	};
}

function memoryDestinations(): DestinationRepository {
	const rows: StoredDestination[] = [];
	const active = (id: number) => rows.find((row) => row.id === id && !row.isArchived);
	const publicOf = ({ id, name, kind }: StoredDestination): Destination => ({ id, name, kind });
	return {
		listActive: () =>
			rows
				.filter((row) => !row.isArchived)
				.sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id)
				.map(publicOf),
		findById: (id) => copy(rows.find((row) => row.id === id) ?? undefined),
		add(destination) {
			const id = rows.length + 1;
			rows.push({ id, name: destination.name, kind: destination.kind, isArchived: false });
			return id;
		},
		update: (id, patch) => (active(id) ? patchRow<StoredDestination>(rows, id, patch) : false),
		archive: (id) => (active(id) ? patchRow(rows, id, { isArchived: true }) : false)
	};
}

function memoryPaydaysAndItems(): Pick<Repositories, 'paydays' | 'items'> {
	const paydayRows: Payday[] = [];
	const itemRows: RouteItem[] = [];
	let nextPaydayId = 1;
	let nextItemId = 1;

	const items: RouteItemRepository = {
		findById: (id) => copy(itemRows.find((row) => row.id === id)),
		listByPayday: (paydayId) =>
			itemRows
				.filter((row) => row.paydayId === paydayId)
				.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
				.map((row) => ({ ...row })),
		listInbox: () =>
			itemRows
				.filter((row) => row.paydayId === null)
				.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
				.map((row) => ({ ...row })),
		add(item) {
			const id = nextItemId++;
			itemRows.push({ ...item, id });
			return id;
		},
		update: (id, patch) => patchRow<RouteItem>(itemRows, id, patch),
		remove(id) {
			const index = itemRows.findIndex((row) => row.id === id);
			if (index >= 0) itemRows.splice(index, 1);
			return index >= 0;
		},
		maxSortOrder: (paydayId) =>
			Math.max(
				-1,
				...itemRows.filter((row) => row.paydayId === paydayId).map((row) => row.sortOrder)
			),
		hasTemplate: (paydayId, templateId) =>
			itemRows.some((row) => row.paydayId === paydayId && row.templateId === templateId)
	};

	const paydays: PaydayRepository = {
		findById: (id) => copy(paydayRows.find((row) => row.id === id)),
		findByScheduledDate: (scheduledDate) =>
			copy(
				[...paydayRows]
					.filter((row) => row.scheduledDate === scheduledDate)
					.sort((a, b) => b.id - a.id)[0]
			),
		listOpen: () =>
			paydayRows
				.filter((row) => !row.isClosed)
				.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate) || a.id - b.id)
				.map((row) => ({ ...row })),
		listClosed: () =>
			paydayRows
				.filter((row) => row.isClosed)
				.sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate) || b.id - a.id)
				.map((row) => ({ ...row })),
		findLatest: () => copy([...paydayRows].sort((a, b) => b.id - a.id)[0]),
		create(payday) {
			const id = nextPaydayId++;
			const {
				title,
				cadence,
				scheduledDate,
				payDate,
				expectedAmount,
				receivedAmount,
				receivedAt,
				note
			} = payday;
			paydayRows.push({
				id,
				title,
				cadence,
				scheduledDate,
				payDate,
				expectedAmount,
				receivedAmount,
				receivedAt,
				note,
				isClosed: false
			});
			return id;
		},
		update: (id, patch) => patchRow<Payday>(paydayRows, id, patch)
	};
	return { paydays, items };
}

function memorySettings(): SettingsRepository {
	let state: Settings = {
		currency: DEFAULT_CURRENCY,
		midMonthSalary: null,
		monthEndSalary: null,
		payRule: DEFAULT_PAY_RULE
	};
	return {
		get: () => ({ ...state, payRule: { ...state.payRule } }),
		setCurrency: (currency: CurrencyCode) => {
			state = { ...state, currency };
		},
		setSalaries: (midMonthSalary, monthEndSalary) => {
			state = { ...state, midMonthSalary, monthEndSalary };
		},
		setPayRule: (payRule: PayRule) => {
			state = { ...state, payRule: normalizePayRule(payRule) };
		}
	};
}

function memoryHolidays(): HolidayRepository {
	const rows: Holiday[] = [];
	let nextId = 1;
	return {
		list: () => rows.map((row) => ({ ...row })),
		findById: (id) => copy(rows.find((row) => row.id === id)),
		add(holiday) {
			const id = nextId++;
			rows.push({ id, date: holiday.date, name: holiday.name, kind: holiday.kind });
			return id;
		},
		remove: (id) => {
			const index = rows.findIndex((row) => row.id === id);
			if (index < 0) return false;
			rows.splice(index, 1);
			return true;
		}
	};
}

function memoryPayOverrides(): PayOverrideRepository {
	const rows = new Map<string, string>();
	return {
		all: () => Object.fromEntries(rows),
		get: (scheduledDate) => rows.get(scheduledDate) ?? null,
		set: (scheduledDate, payDate) => {
			rows.set(scheduledDate, payDate);
		},
		remove: (scheduledDate) => rows.delete(scheduledDate)
	};
}

function memoryActivity(): ActivityEventRepository {
	const rows: ActivityEvent[] = [];
	let nextId = 1;
	return {
		add(event) {
			const id = nextId++;
			rows.push({ id, ...event });
			return id;
		},
		listRecent(limit = 50) {
			return [...rows]
				.sort((a, b) => b.createdAt - a.createdAt || b.id - a.id)
				.slice(0, limit)
				.map((row) => ({ ...row }));
		}
	};
}

/** In-memory repositories with the same contract as the SQLite ones. */
export function createMemoryRepositories(): Repositories {
	return {
		templates: memoryTemplates(),
		destinations: memoryDestinations(),
		...memoryPaydaysAndItems(),
		settings: memorySettings(),
		holidays: memoryHolidays(),
		payOverrides: memoryPayOverrides(),
		activity: memoryActivity(),
		transaction: (work) => work()
	};
}
