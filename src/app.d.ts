import type { Services } from '#lib/server/container.ts';

declare global {
	const __APP_VERSION__: string;

	namespace App {
		interface Error {
			status: number;
			message: string;
		}
		interface Locals {
			services: Services;
			sessionToken: string | null;
			authenticated: boolean;
		}
		interface PageState {
			sheet?: string | null;
			pushed?: boolean;
		}
	}
}

export {};
