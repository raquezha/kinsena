import { DRAGGED_ELEMENT_ID } from 'svelte-dnd-action';

/**
 * Checklist reorder timing (svelte-dnd-action + NN/g / Material guidance).
 *
 * Touch lists that also swipe must use a drag handle — not whole-row long-press.
 * Flip is 0: the library already moves rows; extra FLIP fights drop and feels laggy.
 */
export const CHECKLIST_FLIP_MS = 0;

/** Classes applied to the floating drag ghost (also used in screenshot/e2e hooks). */
export const DRAG_GHOST_CLASS = 'checklist-drag-ghost';

export function styleChecklistDragGhost(element?: HTMLElement): void {
	if (!element) return;
	// Never set transform here — library positions the ghost with translate3d.
	element.classList.add(DRAG_GHOST_CLASS);
}

/**
 * svelte-dnd-action follows the pointer on X and Y. For a vertical checklist that
 * causes a left/right slide (and a diagonal settle on drop). Zero the X translate
 * every frame while dragging so motion stays vertical on mobile/tablet/webview.
 */
let verticalLockRaf = 0;

function lockGhostTranslateX(): void {
	const el = document.getElementById(DRAGGED_ELEMENT_ID);
	if (!el) return;
	const transform = el.style.transform;
	const three = /translate3d\(\s*[^,]+,\s*([^,]+),\s*([^)]+)\)/.exec(transform);
	if (three) {
		const next = `translate3d(0px, ${three[1]}, ${three[2]})`;
		if (transform !== next) el.style.transform = next;
		return;
	}
	const two = /translate\(\s*[^,]+,\s*([^)]+)\)/.exec(transform);
	if (two) {
		const next = `translate(0px, ${two[1]})`;
		if (transform !== next) el.style.transform = next;
	}
}

/** Start the vertical lock once per drag (do not restart on every consider tick). */
export function startVerticalDragLock(): void {
	if (verticalLockRaf) return;
	const tick = () => {
		lockGhostTranslateX();
		verticalLockRaf = requestAnimationFrame(tick);
	};
	verticalLockRaf = requestAnimationFrame(tick);
}

export function stopVerticalDragLock(): void {
	if (verticalLockRaf) cancelAnimationFrame(verticalLockRaf);
	verticalLockRaf = 0;
}
