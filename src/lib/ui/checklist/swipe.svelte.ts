import { prefersReducedMotion, Spring } from 'svelte/motion';
import { springTo } from '../motion.ts';

const AXIS_LOCK_DISTANCE = 8;
const DELETE_DISTANCE = 96;
const DELETE_VELOCITY = -0.7; // px per ms, leftward

/** Horizontal swipe-left-to-delete with a spring snap-back. Vertical drags scroll. */
export class SwipeToDelete {
	readonly offset = new Spring(0, { stiffness: 0.22, damping: 0.6, precision: 0.4 });
	#axis: 'idle' | 'pending' | 'x' | 'y' = 'idle';
	#startX = 0;
	#startY = 0;
	#lastX = 0;
	#lastTime = 0;
	#velocity = 0;
	/** True right after a swipe, so the click that follows is ignored. */
	swiped = false;

	get progress(): number {
		return Math.min(1, -this.offset.current / DELETE_DISTANCE);
	}

	start(event: PointerEvent): void {
		if (event.button !== 0 || event.pointerType === 'mouse') return;
		this.#axis = 'pending';
		this.#startX = this.#lastX = event.clientX;
		this.#startY = event.clientY;
		this.#lastTime = performance.now();
		this.swiped = false;
	}

	move(event: PointerEvent): void {
		if (this.#axis === 'pending') this.#lockAxis(event);
		if (this.#axis !== 'x') return;
		const dx = Math.min(0, event.clientX - this.#startX);
		void springTo(this.offset, dx, { instant: true });
		const now = performance.now();
		this.#velocity = (event.clientX - this.#lastX) / Math.max(1, now - this.#lastTime);
		this.#lastX = event.clientX;
		this.#lastTime = now;
	}

	#lockAxis(event: PointerEvent) {
		const dx = event.clientX - this.#startX;
		const dy = event.clientY - this.#startY;
		if (Math.hypot(dx, dy) < AXIS_LOCK_DISTANCE) return;
		this.#axis = Math.abs(dx) > Math.abs(dy) * 1.15 ? 'x' : 'y';
		if (this.#axis === 'x') {
			(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		}
	}

	/** Ends the gesture. Resolves true when the row should be deleted. */
	async end(): Promise<boolean> {
		const wasSwiping = this.#axis === 'x';
		this.#axis = 'idle';
		if (!wasSwiping) return false;
		this.swiped = true;
		const remove = this.offset.current < -DELETE_DISTANCE || this.#velocity < DELETE_VELOCITY;
		if (!remove) {
			void springTo(this.offset, 0);
			return false;
		}
		return springTo(this.offset, -480, {
			instant: prefersReducedMotion.current,
			preserveMomentum: 120
		});
	}
}
