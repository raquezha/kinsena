import { describe, expect, it, vi, afterEach } from 'vitest';
import { DRAGGED_ELEMENT_ID } from 'svelte-dnd-action';
import {
	CHECKLIST_FLIP_MS,
	DRAG_GHOST_CLASS,
	startVerticalDragLock,
	stopVerticalDragLock,
	styleChecklistDragGhost
} from './checklist-dnd.ts';

describe('checklist drag-handle dnd constants', () => {
	it('disables flip so open-list motion does not fight the drag library', () => {
		expect(CHECKLIST_FLIP_MS).toBe(0);
	});

	it('marks the drag ghost for CSS and screenshot hooks', () => {
		const classes = new Set<string>();
		const el = {
			classList: {
				add: (name: string) => {
					classes.add(name);
				},
				contains: (name: string) => classes.has(name)
			}
		} as unknown as HTMLElement;
		styleChecklistDragGhost(el);
		expect(el.classList.contains(DRAG_GHOST_CLASS)).toBe(true);
		styleChecklistDragGhost(undefined);
	});
});

describe('vertical drag lock', () => {
	afterEach(() => {
		stopVerticalDragLock();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('zeros translate3d X so the ghost cannot drift sideways', () => {
		const style = { transform: 'translate3d(24px, 40px, 0)' };
		const el = { id: DRAGGED_ELEMENT_ID, style } as unknown as HTMLElement;
		vi.stubGlobal('document', {
			getElementById: (id: string) => (id === DRAGGED_ELEMENT_ID ? el : null)
		});

		let frame: FrameRequestCallback | null = null;
		let calls = 0;
		vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
			frame = cb;
			calls += 1;
			return calls;
		});
		vi.stubGlobal('cancelAnimationFrame', () => {
			frame = null;
		});

		startVerticalDragLock();
		startVerticalDragLock(); // second call must not restart the RAF loop
		expect(calls).toBe(1);
		expect(frame).not.toBeNull();
		frame!(0);
		expect(style.transform).toBe('translate3d(0px, 40px, 0)');
		stopVerticalDragLock();
	});

	it('also locks plain translate() X', () => {
		const style = { transform: 'translate(18px, 32px)' };
		const el = { id: DRAGGED_ELEMENT_ID, style } as unknown as HTMLElement;
		vi.stubGlobal('document', {
			getElementById: (id: string) => (id === DRAGGED_ELEMENT_ID ? el : null)
		});
		let frame: FrameRequestCallback | null = null;
		vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
			frame = cb;
			return 1;
		});
		vi.stubGlobal('cancelAnimationFrame', () => {
			frame = null;
		});
		startVerticalDragLock();
		frame!(0);
		expect(style.transform).toBe('translate(0px, 32px)');
		frame!(0); // already locked — no rewrite
		expect(style.transform).toBe('translate(0px, 32px)');
		stopVerticalDragLock();
	});

	it('ignores a missing ghost and non-translate transforms', () => {
		let frame: FrameRequestCallback | null = null;
		vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
			frame = cb;
			return 1;
		});
		vi.stubGlobal('cancelAnimationFrame', () => {
			frame = null;
		});

		vi.stubGlobal('document', { getElementById: () => null });
		startVerticalDragLock();
		frame!(0);
		stopVerticalDragLock();

		const style = { transform: 'matrix(1, 0, 0, 1, 12, 24)' };
		const el = { id: DRAGGED_ELEMENT_ID, style } as unknown as HTMLElement;
		vi.stubGlobal('document', {
			getElementById: (id: string) => (id === DRAGGED_ELEMENT_ID ? el : null)
		});
		startVerticalDragLock();
		frame!(0);
		expect(style.transform).toBe('matrix(1, 0, 0, 1, 12, 24)');
		stopVerticalDragLock();
	});
});
