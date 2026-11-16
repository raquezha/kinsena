import path from 'node:path';
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import { defineConfig, includeIgnoreFile } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore');

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	ts.configs.recommended,
	svelte.configs.recommended,
	prettier,
	svelte.configs.prettier,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		rules: {
			'no-undef': 'off',
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
			'max-lines': ['error', { max: 250, skipBlankLines: true, skipComments: true }],
			'max-lines-per-function': ['warn', { max: 60, skipBlankLines: true, skipComments: true }],
			'max-len': ['error', { code: 100, tabWidth: 2, ignoreUrls: true, ignoreStrings: true }],
			complexity: ['warn', 10],
			// Kinsena is always served from the site root (no paths.base), so plain hrefs are correct.
			'svelte/no-navigation-without-resolve': 'off'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser
			}
		},
		rules: {
			// Recurring cards / checklist chrome need room for markup + scoped CSS together.
			'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
			'max-lines-per-function': 'off',
			'svelte/button-has-type': 'error',
			'svelte/no-at-html-tags': 'error'
		}
	},
	{
		files: ['**/*.test.ts', 'e2e/**', 'src/lib/server/testing/**'],
		rules: { 'max-lines': 'off', 'max-lines-per-function': 'off', complexity: 'off' }
	}
);
