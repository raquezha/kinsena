import { goto } from '$app/navigation';
import { page } from '$app/state';

// Open sheets live in the URL (?sheet=item-12), so Back closes them,
// links work without JavaScript, and a reload keeps the sheet open.

function withParams(mutate: (params: URLSearchParams) => void): string {
	const params = new URLSearchParams(page.url.searchParams.toString());
	mutate(params);
	const search = params.toString();
	return search ? `${page.url.pathname}?${search}` : page.url.pathname;
}

export function currentSheet(): string | null {
	if (page.state.sheet !== undefined) return page.state.sheet;
	return page.url.searchParams.get('sheet');
}

export function currentPaydayId(): number | null {
	const raw = page.url.searchParams.get('p');
	const id = raw ? Number(raw) : NaN;
	return Number.isInteger(id) && id > 0 ? id : null;
}

export function paydayHref(paydayId: number, sheet?: string): string {
	const params = new URLSearchParams();
	params.set('p', String(paydayId));
	if (sheet) params.set('sheet', sheet);
	return `/?${params}`;
}

export function sheetHref(name: string): string {
	return withParams((params) => params.set('sheet', name));
}

export function openSheet(name: string): Promise<void> {
	return goto(sheetHref(name), { shallow: true, state: { sheet: name, pushed: true } });
}

export function closeSheet(): void {
	if (page.state.pushed) {
		history.back();
		return;
	}
	void goto(
		withParams((params) => params.delete('sheet')),
		{
			shallow: true,
			replace: true,
			state: { sheet: null }
		}
	);
}
