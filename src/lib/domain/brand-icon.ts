/** Client-safe brand badge payload resolved on the server. */
export type ResolvedBrandIcon =
	{ kind: 'svg'; path: string; color: string } | { kind: 'monogram'; label: string; color: string };
