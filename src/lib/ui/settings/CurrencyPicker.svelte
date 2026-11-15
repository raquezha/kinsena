<script lang="ts">
	import { enhance } from '$app/forms';
	import { FormState } from '../../client/form-state.svelte.ts';
	import { CURRENCIES, CURRENCY_CODES, type CurrencyCode } from '../../domain/currency.ts';

	let { current }: { current: CurrencyCode } = $props();
	const form = new FormState();
	let formElement: HTMLFormElement | undefined = $state();
</script>

<form
	bind:this={formElement}
	method="POST"
	action="?/currency"
	use:enhance={form.enhance({ close: false, success: 'Currency updated' })}
>
	<fieldset>
		<legend>Currency</legend>
		<p class="hint">Changes the symbol only. It does not convert existing amounts.</p>
		<div class="options">
			{#each CURRENCY_CODES as code (code)}
				<label class="option">
					<input
						type="radio"
						name="currency"
						value={code}
						checked={code === current}
						onchange={() => formElement?.requestSubmit()}
					/>
					<span class="symbol">{CURRENCIES[code].symbol}</span>
					<span class="label">{CURRENCIES[code].label}</span>
					<span class="code">{code}</span>
				</label>
			{/each}
		</div>
	</fieldset>
	{#if form.error}<p class="form-error" role="alert">{form.error}</p>{/if}
	<noscript><button class="button primary" type="submit">Save currency</button></noscript>
</form>

<style>
	fieldset {
		border: 0;
		margin: 0;
		padding: 0;
	}

	legend {
		font-size: var(--text-lg);
		font-weight: 750;
	}

	.hint {
		margin: var(--space-1) 0 var(--space-4);
		color: var(--text-muted);
		font-size: var(--text-sm);
	}

	.options {
		display: grid;
		gap: var(--space-2);
	}

	.option {
		position: relative;
		display: flex;
		align-items: center;
		gap: var(--space-3);
		min-height: 52px;
		padding: 0 var(--space-4);
		border-radius: var(--radius-md);
		border: 1px solid var(--border-subtle);
		background: var(--surface-sunken);
		cursor: pointer;
		transition:
			border-color var(--duration-base),
			background var(--duration-base);
	}

	.option input {
		position: absolute;
		opacity: 0;
		inset: 0;
		cursor: pointer;
	}

	.option:has(input:checked) {
		border-color: var(--accent);
		background: var(--accent-soft);
	}

	.option:has(input:focus-visible) {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	.symbol {
		width: 36px;
		font-weight: 800;
		color: var(--accent);
	}

	.label {
		flex: 1;
		font-weight: 600;
	}

	.code {
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: var(--text-sm);
	}

	@media (min-width: 640px) {
		.options {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 1100px) {
		.options {
			grid-template-columns: repeat(3, 1fr);
		}
	}
</style>
