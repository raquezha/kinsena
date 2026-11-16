/**
 * Checklist reorder timing (svelte-dnd-action + NN/g / Material guidance).
 *
 * Touch lists that also swipe must use a drag handle — not whole-row long-press.
 * Flip stays short: Planned is a 1/2/3-column grid, so siblings need a brief settle
 * without fighting the library’s own drop motion.
 */
export const CHECKLIST_FLIP_MS = 160;

/** Classes applied to the floating drag ghost (also used in screenshot/e2e hooks). */
export const DRAG_GHOST_CLASS = 'checklist-drag-ghost';

/**
 * svelte-dnd-action sizes the ghost from the full `li.row-wrap` (card + decision chips).
 * Hide the chips and clamp height to the card so the gold outline has no empty band.
 */
export function styleChecklistDragGhost(element?: HTMLElement): void {
	if (!element) return;
	// Never set transform here — library positions the ghost with translate3d.
	element.classList.add(DRAG_GHOST_CLASS);

	const decisions = element.querySelector('.decisions') as HTMLElement | null;
	if (decisions) {
		decisions.style.display = 'none';
		decisions.style.height = '0';
		decisions.style.margin = '0';
		decisions.style.padding = '0';
		decisions.style.border = 'none';
	}

	const card = element.querySelector('.swipe') as HTMLElement | null;
	const cardHeight = card?.getBoundingClientRect().height;
	if (cardHeight && cardHeight > 0) {
		element.style.gap = '0';
		element.style.height = `${cardHeight}px`;
		element.style.minHeight = `${cardHeight}px`;
		element.style.maxHeight = `${cardHeight}px`;
		element.style.overflow = 'hidden';
	}
}
