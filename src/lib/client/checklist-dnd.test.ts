import { describe, expect, it } from 'vitest';
import { CHECKLIST_FLIP_MS, DRAG_GHOST_CLASS, styleChecklistDragGhost } from './checklist-dnd.ts';

describe('checklist drag-handle dnd constants', () => {
	it('keeps a short flip so grid siblings settle without fighting the library', () => {
		expect(CHECKLIST_FLIP_MS).toBeGreaterThan(0);
		expect(CHECKLIST_FLIP_MS).toBeLessThanOrEqual(220);
	});

	it('marks the drag ghost for CSS and screenshot hooks', () => {
		const classes = new Set<string>();
		const el = {
			style: {} as CSSStyleDeclaration,
			classList: {
				add: (name: string) => {
					classes.add(name);
				},
				contains: (name: string) => classes.has(name)
			},
			querySelector: () => null
		} as unknown as HTMLElement;
		styleChecklistDragGhost(el);
		expect(el.classList.contains(DRAG_GHOST_CLASS)).toBe(true);
		styleChecklistDragGhost(undefined);
	});

	it('collapses ghost height to the card when decision chips were in the row', () => {
		const style: Record<string, string> = {};
		const decisionsStyle: Record<string, string> = {};
		const card = {
			getBoundingClientRect: () => ({
				height: 129,
				width: 300,
				top: 0,
				left: 0,
				bottom: 129,
				right: 300
			})
		};
		const decisions = { style: decisionsStyle };
		const el = {
			style,
			classList: { add: () => undefined, contains: () => true },
			querySelector: (sel: string) => {
				if (sel === '.decisions') return decisions;
				if (sel === '.swipe') return card;
				return null;
			}
		} as unknown as HTMLElement;

		styleChecklistDragGhost(el);

		expect(decisionsStyle.display).toBe('none');
		expect(style.height).toBe('129px');
		expect(style.maxHeight).toBe('129px');
		expect(style.overflow).toBe('hidden');
		expect(style.gap).toBe('0');
	});
});
