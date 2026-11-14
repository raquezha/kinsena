import { goto } from '$app/navigation';
import { page } from '$app/state';

// Open sheets live in the URL (?sheet=item-12), so Back closes them,
// links work without JavaScript, and a reload keeps the sheet open.

export function currentSheet(): string | null {
	if (page.state.sheet !== undefined) return page.state.sheet;
	return page.url.searchParams.get('sheet');
}

export function sheetHref(name: string): string {
	return `${page.url.pathname}?sheet=${encodeURIComponent(name)}`;
}

export function openSheet(name: string): Promise<void> {
	return goto(sheetHref(name), { shallow: true, state: { sheet: name, pushed: true } });
}

export function closeSheet(): void {
	if (page.state.pushed) {
		history.back();
		return;
	}
	void goto(page.url.pathname, { shallow: true, replace: true, state: { sheet: null } });
}
