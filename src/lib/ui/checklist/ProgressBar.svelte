<script lang="ts">
	import type { CurrencyCode } from '../../domain/currency.ts';
	import type { PaydaySummary } from '../../domain/summary.ts';
	import { formatMoney } from '../../domain/money.ts';

	let { summary, currency }: { summary: PaydaySummary; currency: CurrencyCode } = $props();

	const remaining = $derived(summary.itemCount - summary.doneCount - summary.skippedCount);
</script>

<div class="progress" aria-label="Routing progress">
	<span>{summary.doneCount} done</span>
	<span aria-hidden="true">·</span>
	<span>{remaining} remaining</span>
	{#if summary.leftToRoute !== null}
		<span aria-hidden="true">·</span>
		<span class:over={summary.leftToRoute < 0}>
			{summary.leftToRoute < 0 ? 'Over by' : 'Left to route'}
			{formatMoney(Math.abs(summary.leftToRoute), currency)}
		</span>
	{/if}
</div>

<style>
	.progress {
		position: sticky;
		top: 0;
		z-index: 10;
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1) var(--space-2);
		padding: var(--space-2) var(--space-3);
		margin: 0 calc(var(--space-3) * -1) var(--space-3);
		background: color-mix(in srgb, var(--canvas) 92%, transparent);
		backdrop-filter: blur(12px);
		border-bottom: 1px solid var(--border-subtle);
		color: var(--text-muted);
		font-size: var(--text-sm);
		font-weight: 650;
	}

	.over {
		color: var(--danger);
	}

	@media (min-width: 1100px) {
		.progress {
			display: none;
		}
	}
</style>
