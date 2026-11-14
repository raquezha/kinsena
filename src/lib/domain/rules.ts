import { ensure } from './errors.ts';
import { isValidCents } from './money.ts';
import type { Cents } from './models.ts';

export const MAX_NAME_LENGTH = 128;
export const MAX_NOTE_LENGTH = 280;

export function normalizeName(raw: string): string {
	const name = raw.trim();
	ensure(name.length > 0 && name.length <= MAX_NAME_LENGTH, 'Enter a name up to 128 characters');
	return name;
}

/** Blank titles become "Payday YYYY-MM-DD". */
export function normalizeTitle(raw: string, today: string): string {
	const title = raw.trim();
	ensure(title.length <= MAX_NAME_LENGTH, 'Title is too long');
	return title === '' ? `Payday ${today}` : title;
}

/** Blank notes are removed. */
export function normalizeNote(raw: string | null): string | null {
	const note = (raw ?? '').trim();
	ensure(note.length <= MAX_NOTE_LENGTH, 'Keep the note under 280 characters');
	return note === '' ? null : note;
}

export function ensureMoney(cents: Cents | null, label = 'amount'): void {
	ensure(cents === null || isValidCents(cents), `Invalid ${label}`);
}
