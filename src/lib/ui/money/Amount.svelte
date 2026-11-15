<script lang="ts">
	import { cubicOut } from 'svelte/easing';
	import { prefersReducedMotion, Tween } from 'svelte/motion';
	import type { CurrencyCode } from '../../domain/currency.ts';
	import { currencySymbol } from '../../domain/currency.ts';
	import { formatMoney, splitMoney } from '../../domain/money.ts';

	let {
		cents,
		currency,
		size = 'md'
	}: { cents: number; currency: CurrencyCode; size?: 'md' | 'hero' } = $props();

	// The number rolls to its new value instead of jumping.
	const tween = Tween.of(() => cents, {
		duration: () => (prefersReducedMotion.current ? 0 : 520),
		easing: cubicOut
	});

	const shown = $derived(Math.round(tween.current));
	const parts = $derived(splitMoney(shown));
</script>

{#if size === 'hero'}
	<span class="hero tabular">
		<span class="visually-hidden">{formatMoney(cents, currency)}</span>
		<span class="symbol" aria-hidden="true">{currencySymbol(currency)}</span>
		<span class="whole" aria-hidden="true">{parts.whole}</span>
		<span class="fraction" aria-hidden="true">.{parts.fraction}</span>
	</span>
{:else}
	<span class="tabular">{formatMoney(shown, currency)}</span>
{/if}

<style>
	.hero {
		display: inline-flex;
		align-items: baseline;
		gap: 2px;
		line-height: 1;
		font-weight: 800;
		letter-spacing: -0.04em;
	}

	.symbol {
		font-size: 0.5em;
		color: var(--text-muted);
		margin-right: 4px;
	}

	.whole {
		font-size: 1em;
	}

	.fraction {
		font-size: 0.42em;
		color: var(--text-muted);
		letter-spacing: 0;
	}
</style>
