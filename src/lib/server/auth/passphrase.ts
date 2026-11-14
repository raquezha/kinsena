import { createHash, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';

export const MIN_PASSPHRASE_LENGTH = 16;
const MAX_CANDIDATE_LENGTH = 1024;

export class ConfigurationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ConfigurationError';
	}
}

/** Reads the passphrase, ignoring the trailing newline most editors add. */
export function readPassphraseFile(path: string | undefined): string {
	if (!path) throw new ConfigurationError('Set KINSENA_PASSWORD_FILE to a private passphrase file');
	const passphrase = readFileSync(path, 'utf8').replace(/[\r\n]+$/, '');
	if (passphrase.length < MIN_PASSPHRASE_LENGTH) {
		throw new ConfigurationError(
			`Use a passphrase of at least ${MIN_PASSPHRASE_LENGTH} characters`
		);
	}
	return passphrase;
}

const digest = (value: string) => createHash('sha256').update(value, 'utf8').digest();

export type PassphraseVerifier = (candidate: string) => boolean;

/** Compares fixed-length digests in constant time, so timing reveals nothing. */
export function createPassphraseVerifier(passphrase: string): PassphraseVerifier {
	const expected = digest(passphrase);
	return (candidate) =>
		candidate.length <= MAX_CANDIDATE_LENGTH && timingSafeEqual(expected, digest(candidate));
}
