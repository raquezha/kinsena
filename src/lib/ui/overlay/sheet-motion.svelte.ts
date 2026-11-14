import { prefersReducedMotion, Spring } from 'svelte/motion';

const DISMISS_FRACTION = 0.25;
const DISMISS_VELOCITY = 0.7; // px per ms, downward

/**
 * Drives a sheet's 0..1 open progress with a spring.
 * On phones the user can drag it down; it springs back or dismisses.
 */
export class SheetMotion {
	readonly progress: Spring<number>;
	dragging = $state(false);
	#startY = 0;
	#height = 1;
	#lastY = 0;
	#lastTime = 0;
	#velocity = 0;

	/** Start at 1 when the server already rendered the sheet open. */
	constructor(initial: number) {
		this.progress = new Spring(initial, { stiffness: 0.16, damping: 0.62, precision: 0.001 });
	}

	get current(): number {
		return this.progress.current;
	}

	enter(): Promise<void> {
		return this.progress.set(1, { instant: prefersReducedMotion.current });
	}

	exit(): Promise<void> {
		const momentum = this.#velocity > DISMISS_VELOCITY ? 120 : 0;
		this.#velocity = 0;
		return this.progress.set(0, {
			instant: prefersReducedMotion.current,
			preserveMomentum: momentum
		});
	}

	startDrag(clientY: number, height: number): void {
		this.dragging = true;
		this.#startY = clientY;
		this.#lastY = clientY;
		this.#height = Math.max(height, 1);
		this.#lastTime = performance.now();
		this.#velocity = 0;
	}

	drag(clientY: number): void {
		if (!this.dragging) return;
		const distance = Math.max(0, clientY - this.#startY);
		void this.progress.set(1 - distance / this.#height, { instant: true });
		const now = performance.now();
		this.#velocity = (clientY - this.#lastY) / Math.max(1, now - this.#lastTime);
		this.#lastY = clientY;
		this.#lastTime = now;
	}

	/** Ends a drag. Returns true when the sheet should close. */
	endDrag(): boolean {
		if (!this.dragging) return false;
		this.dragging = false;
		const dismiss =
			1 - this.progress.current > DISMISS_FRACTION || this.#velocity > DISMISS_VELOCITY;
		if (!dismiss) void this.progress.set(1);
		return dismiss;
	}
}
