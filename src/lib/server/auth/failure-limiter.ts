import type { Clock } from '../ports.ts';

export interface FailureLimiter {
	isBlocked(): boolean;
	recordFailure(): void;
	reset(): void;
}

export interface FailureLimiterOptions {
	limit: number;
	windowMs: number;
	clock: Clock;
}

/** Blocks once `limit` failures happen inside `windowMs`, until the oldest one expires. */
export function createFailureLimiter({ limit, windowMs, clock }: FailureLimiterOptions) {
	let failures: number[] = [];
	const prune = () => {
		const now = clock.now().getTime();
		failures = failures.filter((at) => now - at <= windowMs);
	};

	const limiter: FailureLimiter = {
		isBlocked() {
			prune();
			return failures.length >= limit;
		},
		recordFailure() {
			failures.push(clock.now().getTime());
		},
		reset() {
			failures = [];
		}
	};
	return limiter;
}
