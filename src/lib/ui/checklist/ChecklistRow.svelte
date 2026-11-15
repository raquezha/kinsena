<script lang="ts">
	import { enhance, type SubmitFunction } from '$app/forms';
	import { openSheet, sheetHref } from '../../client/sheet-route.ts';
	import type { CurrencyCode } from '../../domain/currency.ts';
	import { hasKnownAmount, type Destination, type RouteItem } from '../../domain/models.ts';
	import { formatMoney } from '../../domain/money.ts';
	import Icon from '../icons/Icon.svelte';
	import DecisionChips from './DecisionChips.svelte';
	import ItemMeta from './ItemMeta.svelte';
	import { SwipeToDelete } from './swipe.svelte.ts';

	let {
		item,
		currency,
		destination,
		routing,
		ontoggle,
		ondelete
	}: {
		item: RouteItem;
		currency: CurrencyCode;
		destination: Destination | null;
		routing: boolean;
		ontoggle: SubmitFunction;
		ondelete: () => void;
	} = $props();

	const swipe = new SwipeToDelete();
	const sheet = $derived(`item-${item.id}`);
	const amount = $derived(
		item.decision === 'PENDING' || item.decision === 'SKIPPED'
			? hasKnownAmount(item)
				? item.fullAmount
				: null
			: item.chosenAmount
	);

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
		class="row"
		class:paid={item.isDone}
		class:skipped={item.decision === 'SKIPPED'}
		style:transform="translateX({swipe.offset.current}px)"
		onpointerdown={(event) => swipe.start(event)}
		onpointermove={(event) => swipe.move(event)}
		onpointerup={onPointerUp}
		onpointercancel={onPointerUp}
		role="presentation"
	>
		{#if routing}
			<form method="POST" action="?/toggle" use:enhance={ontoggle}>
				<input type="hidden" name="itemId" value={item.id} />
				<button
					class="check"
					type="submit"
					aria-pressed={item.isDone}
					aria-label={item.isDone ? `Mark ${item.name} not routed` : `Mark ${item.name} routed`}
				>
					{#if item.isDone}<Icon name="check" size={18} stroke={2.6} />{/if}
				</button>
			</form>
		{/if}
		<a class="open" href={sheetHref(sheet)} onclick={onOpen} data-sveltekit-noscroll>
			<span class="text">
				<span class="name">{item.name}</span>
				<ItemMeta {destination} dueDate={item.dueDate} isDone={item.isDone} />
			</span>
			{#if amount !== null}
				<span class="amount tabular">{formatMoney(amount, currency)}</span>
			{:else}
				<span class="amount missing">Set amount</span>
			{/if}
			<span class="chevron" aria-hidden="true"><Icon name="chevron" size={18} /></span>
		</a>
	</div>
	{#if routing && item.decision !== 'SKIPPED' && !item.isDone}
		<div class="decisions"><DecisionChips {item} /></div>
	{/if}
</div>

<style>
	.swipe {
		position: relative;
		border-radius: var(--radius-md);
		overflow: hidden;
		background: var(--surface);
		border: 1px solid var(--border-subtle);
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

	.row {
		position: relative;
		display: flex;
		align-items: center;
		gap: var(--space-2);
		min-height: 64px;
		padding-left: var(--space-2);
		background: var(--surface);
		touch-action: pan-y;
	}

	.check {
		position: relative;
		display: grid;
		place-items: center;
		width: var(--tap);
		height: var(--tap);
		padding: 0;
		border: 0;
		background: transparent;
		color: var(--accent-ink);
	}

	.check::before {
		content: '';
		position: absolute;
		width: 28px;
		height: 28px;
		border-radius: 9px;
		border: 2px solid var(--border-strong);
		transition:
			border-color var(--duration-fast),
			background var(--duration-fast),
			transform var(--duration-base) var(--ease-spring);
	}

	.check :global(svg) {
		position: relative;
		animation: tick-in 280ms var(--ease-spring);
	}

	.paid .check::before {
		border-color: var(--accent);
		background: var(--accent);
		animation: pop 320ms var(--ease-spring);
	}

	.open {
		flex: 1;
		min-width: 0;
		min-height: 62px;
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding-right: var(--space-3);
		color: inherit;
		text-decoration: none;
	}

	.text {
		flex: 1;
		min-width: 0;
		display: grid;
		gap: 2px;
	}

	.name {
		font-weight: 650;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		transition: color var(--duration-base);
	}

	.amount {
		font-weight: 700;
		color: var(--text);
	}

	.amount.missing {
		color: var(--notice);
		font-size: var(--text-sm);
	}

	.paid .name,
	.paid .amount,
	.skipped .name,
	.skipped .amount {
		color: var(--text-dim);
	}

	.paid .name {
		text-decoration: line-through;
		text-decoration-color: rgb(170 182 174 / 0.5);
	}

	.chevron {
		display: grid;
		color: var(--text-dim);
		opacity: 0.6;
		transition:
			transform var(--duration-fast),
			opacity var(--duration-fast);
	}

	.decisions {
		position: relative;
		padding: 0 var(--space-3) var(--space-3);
		background: var(--surface);
	}

	@media (hover: hover) {
		.swipe:hover {
			border-color: var(--border);
			background: var(--surface-hover);
		}

		.row:hover,
		.swipe:hover .decisions,
		.swipe:hover .row {
			background: var(--surface-hover);
		}

		.row:hover .chevron {
			opacity: 1;
			transform: translateX(2px);
		}

		.check:hover::before {
			border-color: var(--accent);
		}
	}

	@keyframes pop {
		0% {
			transform: scale(0.7);
		}
		60% {
			transform: scale(1.15);
		}
	}

	@keyframes tick-in {
		from {
			transform: scale(0.4);
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.paid .check::before,
		.check :global(svg) {
			animation: none;
		}
	}
</style>
