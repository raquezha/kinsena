<script lang="ts">
	import { enhance } from '$app/forms';
	import { flip } from 'svelte/animate';
	import { prefersReducedMotion } from 'svelte/motion';
	import { crossfade, fade, slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import type { Checklist } from '../../client/checklist.svelte.ts';
	import type { CurrencyCode } from '../../domain/currency.ts';
	import type { Destination } from '../../domain/models.ts';
	import Icon from '../icons/Icon.svelte';
	import ChecklistRow from './ChecklistRow.svelte';

	let {
		checklist,
		paydayId,
		currency,
		destinations
	}: {
		checklist: Checklist;
		paydayId: number;
		currency: CurrencyCode;
		destinations: Destination[];
	} = $props();

	const duration = () => (prefersReducedMotion.current ? 0 : 340);
	const [send, receive] = crossfade({
		duration,
		easing: cubicOut,
		fallback: (node) => slide(node, { duration: duration() })
	});

	function destinationFor(id: number | null) {
		return destinations.find((entry) => entry.id === id) ?? null;
	}

	function movedOrder(items: { id: number }[], index: number, delta: number): number[] | null {
		const next = index + delta;
		if (next < 0 || next >= items.length) return null;
		const ids = items.map((item) => item.id);
		const swap = ids[index]!;
		ids[index] = ids[next]!;
		ids[next] = swap;
		return ids;
	}
</script>

{#snippet section(title: string, count: string, items: typeof checklist.items, kind: string)}
	<section class="group" aria-labelledby="{kind}-heading">
		<h2 id="{kind}-heading">{title} <span class="count">{count}</span></h2>
		<ul class="rows">
			{#each items as item, index (item.id)}
				<li
					class="row-wrap"
					animate:flip={{ duration: duration() }}
					in:receive={{ key: item.id }}
					out:send={{ key: item.id }}
				>
					{#if kind === 'open' && items.length > 1}
						{@const up = movedOrder(items, index, -1)}
						{@const down = movedOrder(items, index, 1)}
						<div class="rank">
							{#if up}
								<form method="POST" action="?/reorder" use:enhance>
									<input type="hidden" name="paydayId" value={paydayId} />
									<input type="hidden" name="orderedIds" value={JSON.stringify(up)} />
									<button class="rank-btn" type="submit" aria-label={`Move ${item.name} up`}>
										<Icon name="chevronUp" size={16} />
									</button>
								</form>
							{:else}
								<span class="rank-btn" aria-hidden="true"></span>
							{/if}
							{#if down}
								<form method="POST" action="?/reorder" use:enhance>
									<input type="hidden" name="paydayId" value={paydayId} />
									<input type="hidden" name="orderedIds" value={JSON.stringify(down)} />
									<button class="rank-btn" type="submit" aria-label={`Move ${item.name} down`}>
										<Icon name="chevronDown" size={16} />
									</button>
								</form>
							{:else}
								<span class="rank-btn" aria-hidden="true"></span>
							{/if}
						</div>
					{/if}
					<div class="row-body">
						<ChecklistRow
							{item}
							{currency}
							destination={destinationFor(item.destinationId)}
							routing={checklist.routing}
							ontoggle={checklist.toggle(item)}
							ondelete={() => checklist.remove(item)}
						/>
					</div>
				</li>
			{/each}
		</ul>
	</section>
{/snippet}

<div class="checklist">
	{#if checklist.items.length === 0}
		<p class="empty" in:fade>
			{#if checklist.routing}
				No bills on this payday. Salary stays unrouted — or add a transfer to an account.
			{:else}
				Add statements and bills you will pay from this payday.
			{/if}
		</p>
	{/if}
	{#if checklist.unpaid.length > 0}
		{@render section(
			checklist.routing ? 'To route' : 'Planned',
			`${checklist.unpaid.length}`,
			checklist.unpaid,
			'open'
		)}
	{/if}
	{#if checklist.paid.length > 0}
		{@render section('Routed', `${checklist.paid.length}`, checklist.paid, 'done')}
	{/if}
	{#if checklist.skipped.length > 0}
		{@render section('Skipped', `${checklist.skipped.length}`, checklist.skipped, 'skipped')}
	{/if}
</div>

<style>
	.checklist {
		display: grid;
		gap: var(--space-8);
	}

	.group {
		display: grid;
		gap: var(--space-5);
	}

	h2 {
		font-size: 1.45rem;
	}

	.count {
		margin-left: var(--space-1);
		color: var(--text-dim);
		font-size: var(--text-sm);
		font-weight: 600;
	}

	.rows {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--space-5);
	}

	.row-wrap {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: var(--space-2);
		align-items: start;
	}

	.row-wrap:not(:has(.rank)) {
		grid-template-columns: minmax(0, 1fr);
	}

	.rank {
		display: grid;
		gap: 2px;
		padding-top: 0.55rem;
	}

	.rank-btn {
		display: grid;
		place-items: center;
		width: 2rem;
		height: 1.6rem;
		padding: 0;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--surface);
		color: var(--text-muted);
	}

	.rank-btn:disabled {
		opacity: 0.35;
	}

	.row-body {
		min-width: 0;
	}

	.empty {
		padding: var(--space-6);
		border: 1px dashed var(--border-strong);
		border-radius: var(--radius-lg);
		color: var(--text-muted);
		text-align: center;
	}
</style>
