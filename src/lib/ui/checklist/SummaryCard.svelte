<script lang="ts">
	import type { CurrencyCode } from '../../domain/currency.ts';
	import type { Cycle } from '../../domain/models.ts';
	import { formatMoney } from '../../domain/money.ts';
	import type { CycleSummary } from '../../domain/summary.ts';
	import Amount from '../money/Amount.svelte';
	import ChipEmblem from '../brand/ChipEmblem.svelte';

	let {
		cycle,
		summary,
		currency
	}: { cycle: Cycle; summary: CycleSummary; currency: CurrencyCode } = $props();

	const progress = $derived(summary.total === 0 ? 0 : summary.paid / summary.total);
	const hasSalary = $derived(summary.leftover !== null);
</script>

<section class="wallet" aria-label="Cycle summary">
	<header>
		<ChipEmblem />
		<span class="eyebrow">
			{#if cycle.salary !== null}
				Leftover · salary {formatMoney(cycle.salary, currency)}
			{:else}
				Still to pay
			{/if}
		</span>
	</header>

	<div class="hero" class:negative={(summary.leftover ?? 0) < 0}>
		<Amount
			cents={hasSalary ? (summary.leftover ?? 0) : summary.remaining}
			{currency}
			size="hero"
		/>
	</div>

	<div
		class="progress"
		role="progressbar"
		aria-label="Paid so far"
		aria-valuemin={0}
		aria-valuemax={100}
		aria-valuenow={Math.round(progress * 100)}
	>
		<span style:transform="scaleX({progress})"></span>
	</div>

	<dl class="stats">
		<div>
			<dt>To pay</dt>
			<dd><Amount cents={summary.remaining} {currency} /></dd>
		</div>
		<div>
			<dt>Paid</dt>
			<dd><Amount cents={summary.paid} {currency} /></dd>
		</div>
		<div>
			<dt>Known total</dt>
			<dd><Amount cents={summary.total} {currency} /></dd>
		</div>
		<div>
			<dt>Done</dt>
			<dd class="tabular">{summary.doneCount} of {summary.itemCount}</dd>
		</div>
	</dl>

	{#if summary.missingCount > 0}
		<p class="warning" role="note">
			{summary.missingCount}
			{summary.missingCount === 1 ? 'amount' : 'amounts'} missing; totals exclude
			{summary.missingCount === 1 ? 'it' : 'them'}.
		</p>
	{/if}
</section>

<style>
	.wallet {
		position: relative;
		overflow: hidden;
		display: grid;
		gap: var(--space-4);
		padding: var(--space-5);
		border-radius: var(--radius-lg);
		border: 1px solid rgb(181 216 193 / 0.16);
		background:
			radial-gradient(circle at 100% 0%, rgb(181 216 193 / 0.14), transparent 55%),
			linear-gradient(140deg, #1a241e 0%, #0f1612 60%, #0b100d 100%);
		box-shadow: var(--shadow-card);
	}

	header {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.eyebrow {
		color: var(--text-muted);
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.hero {
		font-size: var(--text-hero);
	}

	.hero.negative {
		color: var(--danger);
	}

	.progress {
		height: 6px;
		border-radius: 999px;
		background: rgb(255 255 255 / 0.07);
		overflow: hidden;
	}

	.progress span {
		display: block;
		height: 100%;
		background: linear-gradient(90deg, var(--accent), var(--accent-strong));
		transform-origin: left;
		transition: transform var(--duration-slow) var(--ease-out);
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-3) var(--space-4);
		margin: 0;
	}

	dt {
		color: var(--text-dim);
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	dd {
		margin: 2px 0 0;
		font-weight: 700;
	}

	.warning {
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-sm);
		background: var(--notice-soft);
		color: var(--notice);
		font-size: var(--text-sm);
		font-weight: 600;
	}

	@media (min-width: 640px) and (max-width: 1099.98px) {
		.stats {
			grid-template-columns: repeat(4, 1fr);
		}
	}
</style>
