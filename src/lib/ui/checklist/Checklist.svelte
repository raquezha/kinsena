<script lang="ts">
	import { flip } from 'svelte/animate';
	import { prefersReducedMotion } from 'svelte/motion';
	import { crossfade, fade, slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import type { Checklist } from '../../client/checklist.svelte.ts';
	import type { CurrencyCode } from '../../domain/currency.ts';
	import type { Destination } from '../../domain/models.ts';
	import ChecklistRow from './ChecklistRow.svelte';

	let {
		checklist,
		currency,
		destinations
	}: {
		checklist: Checklist;
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
</script>

{#snippet section(title: string, count: string, items: typeof checklist.items, kind: string)}
	<section class="group" aria-labelledby="{kind}-heading">
		<h2 id="{kind}-heading">{title} <span class="count">{count}</span></h2>
		<ul class="rows">
			{#each items as item (item.id)}
				<li
					animate:flip={{ duration: duration() }}
					in:receive={{ key: item.id }}
					out:send={{ key: item.id }}
				>
					<ChecklistRow
						{item}
						{currency}
						destination={destinationFor(item.destinationId)}
						routing={checklist.routing}
						ontoggle={checklist.toggle(item)}
						ondelete={() => checklist.remove(item)}
					/>
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
		gap: var(--space-6);
	}

	.group {
		display: grid;
		gap: var(--space-3);
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
		gap: var(--space-2);
	}

	.empty {
		padding: var(--space-6);
		border: 1px dashed var(--border-strong);
		border-radius: var(--radius-lg);
		color: var(--text-muted);
		text-align: center;
	}
</style>
