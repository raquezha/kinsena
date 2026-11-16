<script lang="ts">
	import { enhance } from '$app/forms';
	import { FormState } from '../../client/form-state.svelte.ts';
	import type { ResolvedBrandIcon } from '../../domain/brand-icon.ts';
	import type { CurrencyCode } from '../../domain/currency.ts';
	import { hasKnownAmount, type Destination } from '../../domain/models.ts';
	import { formatMoney } from '../../domain/money.ts';
	import type { PaydayView } from '../../domain/summary.ts';
	import { formatCycleDate } from '../checklist/dates.ts';
	import BrandMark from '../defaults/BrandMark.svelte';
	import Icon from '../icons/Icon.svelte';

	let {
		view,
		currency,
		destinations,
		reopenable
	}: {
		view: PaydayView;
		currency: CurrencyCode;
		destinations: (Destination & { brandIcon?: ResolvedBrandIcon | null })[];
		reopenable: boolean;
	} = $props();

	const reopen = new FormState();
	const { payday, summary } = $derived(view);

	function destinationFor(id: number | null) {
		return destinations.find((entry) => entry.id === id) ?? null;
	}
</script>

<section class="ledger" aria-label={`Statement for ${payday.title}`}>
	<header class="head">
		<div>
			<p class="eyebrow">Statement</p>
			<h2>{payday.title}</h2>
			<p class="meta">{formatCycleDate(payday.scheduledDate)}</p>
		</div>
		<div class="figures">
			<span class="label">Kept</span>
			<span class="kept tabular">
				{summary.leftToRoute === null ? '—' : formatMoney(summary.leftToRoute, currency)}
			</span>
		</div>
	</header>

	{#if payday.note}<p class="note">{payday.note}</p>{/if}

	<ul class="lines">
		{#each view.items as item (item.id)}
			{@const dest = destinationFor(item.destinationId)}
			<li class:done={item.isDone}>
				<span class="mark" aria-label={item.isDone ? 'Routed' : item.decision}>
					{#if item.isDone}<Icon name="check" size={14} stroke={3} />{/if}
				</span>
				<span class="body">
					<span class="name">{item.name}</span>
					{#if dest}
						<span class="dest">
							{#if dest.brandIcon}
								<span class="brand"><BrandMark brandIcon={dest.brandIcon} size={10} /></span>
							{/if}
							→ {dest.name}
						</span>
					{:else}
						<span class="dest muted">→ No destination</span>
					{/if}
				</span>
				<span class="amt tabular">
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
			<button class="button block" type="submit" disabled={reopen.busy}>Reopen payday</button>
		</form>
	{/if}
</section>

<style>
	.ledger {
		display: grid;
		gap: 1rem;
		padding: 1.25rem;
		border-radius: 0.875rem;
		background: linear-gradient(145deg, rgb(32 30 26 / 0.85) 0%, rgb(22 21 18 / 0.95) 100%);
		border: 1px solid rgb(255 255 255 / 0.08);
		box-shadow: 0 8px 24px rgb(0 0 0 / 0.35);
		min-height: 100%;
	}

	.head {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		align-items: flex-start;
	}

	.eyebrow {
		margin: 0 0 0.25rem;
		color: rgb(255 255 255 / 0.45);
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	h2 {
		margin: 0;
		font-size: 1.35rem;
		font-weight: 800;
		color: #f3efe6;
	}

	.meta {
		margin: 0.2rem 0 0;
		color: rgb(255 255 255 / 0.5);
		font-size: 0.75rem;
	}

	.figures {
		display: grid;
		gap: 0.15rem;
		text-align: right;
	}

	.label {
		color: rgb(255 255 255 / 0.45);
		font-size: 0.75rem;
		font-weight: 600;
	}

	.kept {
		font-size: 1.35rem;
		font-weight: 800;
		color: var(--accent);
		font-variant-numeric: tabular-nums;
	}

	.note {
		margin: 0;
		color: var(--text-muted);
		font-size: var(--text-sm);
	}

	.lines {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.4rem;
	}

	li {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-height: 2.75rem;
		padding: 0.55rem 0.65rem;
		border-radius: 0.625rem;
		background: rgb(255 255 255 / 0.03);
		border: 1px solid rgb(255 255 255 / 0.05);
	}

	.mark {
		display: grid;
		place-items: center;
		width: 1.25rem;
		height: 1.25rem;
		flex-shrink: 0;
		border-radius: 0.35rem;
		border: 1.5px solid var(--border-strong);
		color: var(--accent-ink);
	}

	.done .mark {
		background: var(--accent);
		border-color: var(--accent);
	}

	.body {
		flex: 1;
		min-width: 0;
		display: grid;
		gap: 0.1rem;
	}

	.name {
		font-weight: 650;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.dest {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		color: var(--text-muted);
		font-size: 0.75rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.dest.muted {
		opacity: 0.8;
	}

	.brand {
		display: inline-flex;
		flex-shrink: 0;
	}

	.amt {
		flex-shrink: 0;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}
</style>
