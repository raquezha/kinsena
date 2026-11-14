<script lang="ts">
	import { flip } from 'svelte/animate';
	import { prefersReducedMotion } from 'svelte/motion';
	import { crossfade, fade, slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import type { Checklist } from '../../client/checklist.svelte.ts';
	import type { CurrencyCode } from '../../domain/currency.ts';
	import ChecklistRow from './ChecklistRow.svelte';

	let { checklist, currency }: { checklist: Checklist; currency: CurrencyCode } = $props();

	const duration = () => (prefersReducedMotion.current ? 0 : 340);

	// Rows glide between "To pay" and "Paid" instead of jumping.
	const [send, receive] = crossfade({
		duration,
		easing: cubicOut,
		fallback: (node) => slide(node, { duration: duration() })
	});
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
			No items yet. Add one with the <strong>+</strong> button, or save recurring items under
			<a href="/defaults">Defaults</a>.
		</p>
	{/if}
	{#if checklist.unpaid.length > 0 || checklist.paid.length === 0}
		{@render section('To pay', `${checklist.unpaid.length} left`, checklist.unpaid, 'unpaid')}
	{/if}
	{#if checklist.paid.length > 0}
		{@render section('Paid', `${checklist.paid.length}`, checklist.paid, 'paid')}
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
		font-size: var(--text-lg);
		font-weight: 750;
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
