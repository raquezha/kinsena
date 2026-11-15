/** Items that still need a look before a payday can be finished cleanly. */
export type FinishIssueKind = 'pending' | 'undone' | 'skipped';

export interface FinishIssue {
	itemId: number;
	name: string;
	kind: FinishIssueKind;
}
