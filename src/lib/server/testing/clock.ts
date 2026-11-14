import type { Clock } from '../ports.ts';

/** A clock tests can move forward by hand. */
export function createTestClock(start = new Date(2026, 9, 15, 9, 0, 0)) {
	let current = start.getTime();
	const clock: Clock & { advance(ms: number): void } = {
		now: () => new Date(current),
		advance: (ms) => {
			current += ms;
		}
	};
	return clock;
}
