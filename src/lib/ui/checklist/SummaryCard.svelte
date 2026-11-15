<script lang="ts">
	import { isReceived, type Payday } from '../../domain/models.ts';
	import { formatMoney } from '../../domain/money.ts';
	import type { CurrencyCode } from '../../domain/currency.ts';
	import type { PaydaySummary } from '../../domain/summary.ts';
	import Amount from '../money/Amount.svelte';
	import ChipEmblem from '../brand/ChipEmblem.svelte';

	let {
		payday,
		summary,
		currency
	}: { payday: Payday; summary: PaydaySummary; currency: CurrencyCode } = $props();

	const received = $derived(isReceived(payday));
	const progress = $derived(summary.plannedFull === 0 ? 0 : summary.routed / summary.plannedFull);
	const kept = $derived(
		received && summary.itemCount - summary.skippedCount === 0 && summary.salary !== null
	);
	function plannedRange(): string {
		if (summary.plannedMin === summary.plannedFull) {
			return formatMoney(summary.plannedFull, currency);
		}
		const min = formatMoney(summary.plannedMin, currency);
		const full = formatMoney(summary.plannedFull, currency);
		return `${min} – ${full}`;
	}

	const range = $derived(plannedRange());
</script>

<section class="wallet" aria-label="Payday summary">
	<header>
		<ChipEmblem />
		<span class="eyebrow">
			{#if kept}
				Kept in full
			{:else if received}
				Left to route
			{:else}
				Expected salary
			{/if}
		</span>
	</header>

	<div class="hero" class:negative={(summary.leftToRoute ?? 0) < 0}>
		<Amount
			cents={received ? (summary.leftToRoute ?? summary.salary ?? 0) : (summary.salary ?? 0)}
			{currency}
			size="hero"
		/>
	</div>

	<div
		class="progress"
		role="progressbar"
		aria-label="Routed so far"
		aria-valuemin={0}
		aria-valuemax={100}
		aria-valuenow={Math.round(Math.min(progress, 1) * 100)}
	>
		<span style:transform="scaleX({Math.min(progress, 1)})"></span>
	</div>

	<dl class="stats">
		<div>
			<dt>Salary</dt>
			<dd>
				{#if summary.salary !== null}
					<Amount cents={summary.salary} {currency} />
				{:else}
					<span class="muted">Not set</span>
				{/if}
			</dd>
		</div>
		<div>
			<dt>Planned</dt>
			<dd class="tabular">{range}</dd>
		</div>
		<div>
			<dt>Routed</dt>
			<dd><Amount cents={summary.routed} {currency} /></dd>
		</div>
		<div>
			<dt>Done</dt>
			<dd class="tabular">{summary.doneCount} of {summary.itemCount}</dd>
		</div>
		<div>
			<dt>Remaining</dt>
			<dd class="tabular">{summary.itemCount - summary.doneCount - summary.skippedCount}</dd>
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

	.muted {
		color: var(--text-dim);
		font-weight: 600;
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
