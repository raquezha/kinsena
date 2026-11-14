import type { Spring } from 'svelte/motion';

/**
 * Moves a spring and reports whether it reached the target.
 * Svelte rejects the previous promise with "Aborted" when a newer target interrupts it;
 * that is expected during gestures, so it resolves false instead of throwing.
 */
export function springTo(
	spring: Spring<number>,
	value: number,
	options?: Parameters<Spring<number>['set']>[1]
): Promise<boolean> {
	return spring.set(value, options).then(
		() => true,
		() => false
	);
}
