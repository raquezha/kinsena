/** A rule was broken by user input or app state. Shown to the user as-is. */
export class DomainError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'DomainError';
	}
}

export function ensure(condition: boolean, message: string): asserts condition {
	if (!condition) throw new DomainError(message);
}
