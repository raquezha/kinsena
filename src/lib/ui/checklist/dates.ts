const display = new Intl.DateTimeFormat('en-US', {
	month: 'short',
	day: 'numeric',
	year: 'numeric'
});

const short = new Intl.DateTimeFormat('en-US', {
	month: 'short',
	day: 'numeric'
});

/** "2026-10-15" -> "Oct 15, 2026", read as a calendar date (no time zone shift). */
export function formatCycleDate(isoDate: string): string {
	return formatWith(display, isoDate);
}

export function formatShortDate(isoDate: string): string {
	return formatWith(short, isoDate);
}

function formatWith(formatter: Intl.DateTimeFormat, isoDate: string): string {
	const [year = 1970, month = 1, day = 1] = isoDate.split('-').map(Number);
	return formatter.format(new Date(year, month - 1, day));
}
