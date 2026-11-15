import { createAuthService, type AuthService } from './auth/auth-service.ts';
import { createFailureLimiter } from './auth/failure-limiter.ts';
import { createPassphraseVerifier, readPassphraseFile } from './auth/passphrase.ts';
import { createSessionStore } from './auth/session-store.ts';
import type { AppConfig } from './config.ts';
import { openDatabase } from './data/database.ts';
import { migrateDatabase } from './data/migrate.ts';
import { createSqliteRepositories } from './data/repositories/index.ts';
import type { Clock, Repositories } from './ports.ts';
import {
	createDestinationService,
	type DestinationService
} from './services/destination-service.ts';
import { createPaydayService, type PaydayService } from './services/payday-service.ts';
import { createPlanService, type PlanService } from './services/plan-service.ts';
import { createRouteService, type RouteService } from './services/route-service.ts';
import { createScheduleService, type ScheduleService } from './services/schedule-service.ts';
import { createSettingsService, type SettingsService } from './services/settings-service.ts';
import { createTemplateService, type TemplateService } from './services/template-service.ts';

export interface Services {
	auth: AuthService;
	paydays: PaydayService;
	items: RouteService;
	plans: PlanService;
	templates: TemplateService;
	destinations: DestinationService;
	settings: SettingsService;
	schedule: ScheduleService;
}

export const systemClock: Clock = { now: () => new Date() };

export const LOGIN_FAILURE_LIMIT = 10;
export const LOGIN_FAILURE_WINDOW_MS = 60_000;

/** Wires services to any repositories. Tests pass in-memory fakes and a fixed clock. */
export function createServices(repos: Repositories, passphrase: string, clock: Clock): Services {
	const limiter = createFailureLimiter({
		limit: LOGIN_FAILURE_LIMIT,
		windowMs: LOGIN_FAILURE_WINDOW_MS,
		clock
	});
	const paydays = createPaydayService(repos, clock);
	const schedule = createScheduleService(repos, clock);
	return {
		auth: createAuthService({
			verify: createPassphraseVerifier(passphrase),
			sessions: createSessionStore(clock),
			limiter
		}),
		paydays,
		items: createRouteService(repos, paydays),
		plans: createPlanService(repos, paydays),
		templates: createTemplateService(repos, clock),
		destinations: createDestinationService(repos.destinations, clock),
		settings: createSettingsService(repos.settings),
		schedule
	};
}

/** Production wiring: read the passphrase, open and migrate SQLite. Throws to refuse start. */
export function createAppServices(config: AppConfig): Services {
	const passphrase = readPassphraseFile(config.passwordFile);
	const database = openDatabase(config.dbPath);
	migrateDatabase(database, config.migrationsFolder);
	return createServices(createSqliteRepositories(database.db), passphrase, systemClock);
}
