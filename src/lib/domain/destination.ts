/** A saved place salary can go: a bank account or a biller. */
export const DESTINATION_KINDS = ['ACCOUNT', 'BILLER'] as const;

export type DestinationKind = (typeof DESTINATION_KINDS)[number];

export const DESTINATION_KIND_LABELS: Record<DestinationKind, string> = {
	ACCOUNT: 'Account',
	BILLER: 'Biller'
};

export function isDestinationKind(value: string): value is DestinationKind {
	return (DESTINATION_KINDS as readonly string[]).includes(value);
}

/** Live template reference label for destination cards. */
export function formatTemplateUsageLabel(count: number): string {
	if (count <= 0) return 'Not used yet';
	if (count === 1) return 'Used in 1 template';
	return `Used in ${count} templates`;
}
