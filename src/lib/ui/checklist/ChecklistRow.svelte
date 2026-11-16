<script lang="ts">
	import { type SubmitFunction } from '$app/forms';
	import { openSheet } from '../../client/sheet-route.ts';
	import type { ResolvedBrandIcon } from '../../domain/brand-icon.ts';
	import type { CurrencyCode } from '../../domain/currency.ts';
	import type { Destination, RouteItem } from '../../domain/models.ts';
	import Icon from '../icons/Icon.svelte';
	import ChecklistItemCard from './ChecklistItemCard.svelte';
	import { SwipeToDelete } from './swipe.svelte.ts';

	let {
		item,
		currency,
		destination,
		installment = null,
		routing,
		showHandle = false,
		ontoggle,
		ondelete
	}: {
		item: RouteItem & { resolvedBrandIcon?: ResolvedBrandIcon | null };
		currency: CurrencyCode;
		destination: (Destination & { brandIcon?: ResolvedBrandIcon | null }) | null;
		installment?: string | null;
		routing: boolean;
		showHandle?: boolean;
		ontoggle: SubmitFunction;
		ondelete: () => void;
	} = $props();

	const swipe = new SwipeToDelete();
	const sheet = $derived(`item-${item.id}`);

	function onOpen(event: MouseEvent) {
		event.preventDefault();
		if (swipe.swiped) return;
		void openSheet(sheet);
	}

	async function onPointerUp() {
		if (await swipe.end()) ondelete();
	}
</script>

<div class="swipe" style:--swipe={swipe.progress}>
	<div class="behind" aria-hidden="true"><Icon name="trash" size={20} /> Delete</div>
	<div
		class="card"
		class:paid={item.isDone}
		class:skipped={item.decision === 'SKIPPED'}
		style:transform="translateX({swipe.offset.current}px)"
		onpointerdown={(event) => swipe.start(event)}
		onpointermove={(event) => swipe.move(event)}
		onpointerup={onPointerUp}
		onpointercancel={onPointerUp}
		role="presentation"
	>
		<ChecklistItemCard
			{item}
			{currency}
			{destination}
			{installment}
			{routing}
			{showHandle}
			{sheet}
			{ontoggle}
			{onOpen}
		/>
	</div>
</div>

<style>
	.swipe {
		position: relative;
		border-radius: 1rem;
		overflow: hidden;
		height: 100%;
	}
	.behind {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: var(--space-2);
		padding-right: var(--space-5);
		background: var(--danger-solid);
		color: var(--danger);
		font-weight: 700;
		opacity: calc(0.4 + var(--swipe) * 0.6);
	}
	.card {
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		min-height: 8.0625rem;
		padding: 0.875rem 1rem;
		background: var(--surface);
		border: 1px solid var(--border-subtle);
		border-radius: 1rem;
		touch-action: pan-y;
		transition:
			border-color var(--duration-fast),
			opacity var(--duration-fast);
	}
	.card.paid,
	.card.skipped {
		opacity: 0.62;
	}
	@media (hover: hover) {
		.card:hover {
			border-color: var(--border);
		}
	}
</style>
