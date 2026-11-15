<script lang="ts">
	import { enhance } from '$app/forms';
	import { slide } from 'svelte/transition';
	import { FormState } from '../../client/form-state.svelte.ts';
	import type { CurrencyCode } from '../../domain/currency.ts';
	import { hasKnownAmount } from '../../domain/models.ts';
	import { formatMoney } from '../../domain/money.ts';
	import type { PaydayView } from '../../domain/summary.ts';
	import { formatCycleDate } from '../checklist/dates.ts';
	import Icon from '../icons/Icon.svelte';

	let {
		view,
		currency,
		reopenable
	}: { view: PaydayView; currency: CurrencyCode; reopenable: boolean } = $props();

	let expanded = $state(false);
	const reopen = new FormState();
	const { payday, summary } = $derived(view);
</script>

<article class="history-card" class:expanded>
	<button
		class="summary"
		type="button"
		aria-expanded={expanded}
		onclick={() => (expanded = !expanded)}
	>
		<span class="titles">
			<span class="title">{payday.title}</span>
			<span class="meta">
				{formatCycleDate(payday.scheduledDate)} · {summary.doneCount} of {summary.itemCount} routed
			</span>
		</span>
		<span class="figures">
			<span class="paid tabular">{formatMoney(summary.routed, currency)}</span>
			{#if summary.leftToRoute !== null}
				<span class="leftover tabular">Kept {formatMoney(summary.leftToRoute, currency)}</span>
			{/if}
		</span>
		<span class="chevron" aria-hidden="true"><Icon name="chevron" size={18} /></span>
	</button>

	{#if expanded}
		<div class="details" transition:slide={{ duration: 260 }}>
			{#if payday.note}<p class="note">{payday.note}</p>{/if}
			<ul>
				{#each view.items as item (item.id)}
					<li class:done={item.isDone}>
						<span class="mark" aria-label={item.isDone ? 'Routed' : item.decision}>
							{#if item.isDone}<Icon name="check" size={14} stroke={3} />{/if}
						</span>
						<span class="name">{item.name}</span>
						<span class="tabular">
							{hasKnownAmount(item)
								? formatMoney(item.chosenAmount || item.fullAmount, currency)
								: 'No amount'}
						</span>
					</li>
				{/each}
			</ul>
			{#if reopenable}
				<form method="POST" action="?/reopen" use:enhance={reopen.enhance({ close: false })}>
					<input type="hidden" name="paydayId" value={payday.id} />
					{#if reopen.error}<p class="form-error" role="alert">{reopen.error}</p>{/if}
					<button class="button block" type="submit" disabled={reopen.busy}
						>Reopen this payday</button
					>
				</form>
			{/if}
		</div>
	{/if}
</article>

<style>
	.history-card {
		background: var(--surface);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-lg);
		overflow: hidden;
		transition: border-color var(--duration-base);
	}

	.history-card.expanded {
		border-color: var(--border);
	}

	.summary {
		width: 100%;
		display: flex;
		align-items: center;
		gap: var(--space-3);
		min-height: 72px;
		padding: var(--space-3) var(--space-4);
		border: 0;
		background: transparent;
		text-align: left;
	}

	.titles,
	.figures {
		display: grid;
		gap: 2px;
	}

	.titles {
		flex: 1;
		min-width: 0;
	}

	.title {
		font-weight: 700;
	}

	.meta,
	.leftover {
		color: var(--text-dim);
		font-size: var(--text-sm);
	}

	.figures {
		text-align: right;
	}

	.paid {
		font-weight: 700;
	}

	.chevron {
		display: grid;
		color: var(--text-dim);
		transition: transform var(--duration-base) var(--ease-out);
	}

	.expanded .chevron {
		transform: rotate(90deg);
	}

	.details {
		padding: 0 var(--space-4) var(--space-4);
		display: grid;
		gap: var(--space-3);
	}

	.note {
		color: var(--text-muted);
		font-size: var(--text-sm);
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--space-1);
	}

	li {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		min-height: 40px;
		padding: 0 var(--space-2);
		border-radius: var(--radius-sm);
		background: var(--surface-sunken);
		font-size: var(--text-sm);
	}

	.mark {
		display: grid;
		place-items: center;
		width: 20px;
		height: 20px;
		border-radius: 6px;
		border: 1.5px solid var(--border-strong);
		color: var(--accent-ink);
	}

	.done .mark {
		background: var(--accent);
		border-color: var(--accent);
	}

	.name {
		flex: 1;
	}

	@media (hover: hover) {
		.summary:hover {
			background: var(--surface-hover);
		}
	}
</style>
