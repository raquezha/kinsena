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
		border-radius: 0.875rem;
		overflow: hidden;
		height: 100%;
	}
	/* Let the routing popover escape the rounded card while open. */
	.swipe:has(:global(.more.open)) {
		overflow: visible;
		z-index: 25;
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
		/* Resting opacity must be 0 — paid/skipped cards used to show Delete through translucency. */
		opacity: var(--swipe);
		pointer-events: none;
	}
	.card {
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		min-height: 8.5rem;
		padding: 1rem;
		background: linear-gradient(145deg, rgb(32 30 26 / 0.85) 0%, rgb(22 21 18 / 0.95) 100%);
		border: 1px solid rgb(255 255 255 / 0.08);
		border-radius: 0.875rem;
		box-shadow: 0 8px 24px rgb(0 0 0 / 0.35);
		touch-action: pan-y;
		overflow: hidden;
		transition:
			transform 160ms ease,
			box-shadow 160ms ease,
			border-color 160ms ease,
			opacity 160ms ease;
	}
	.swipe:has(:global(.more.open)) .card {
		overflow: visible;
	}
	/* Fade content only so the opaque surface still hides the swipe Delete layer. */
	.card.paid > :global(*),
	.card.skipped > :global(*) {
		opacity: 0.62;
	}
	@media (hover: hover) {
		.card:hover {
			border-color: rgb(255 255 255 / 0.14);
		}
	}
</style>
