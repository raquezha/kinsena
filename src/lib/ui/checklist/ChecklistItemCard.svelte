<script lang="ts">
	import { enhance, type SubmitFunction } from '$app/forms';
	import { dragHandle } from 'svelte-dnd-action';
	import { sheetHref } from '../../client/sheet-route.ts';
	import type { ResolvedBrandIcon } from '../../domain/brand-icon.ts';
	import type { CurrencyCode } from '../../domain/currency.ts';
	import { isRoutedDecision } from '../../domain/decision.ts';
	import { hasKnownAmount, type Destination, type RouteItem } from '../../domain/models.ts';
	import { formatMoney } from '../../domain/money.ts';
	import { getRecurringIcon } from '../../domain/recurring-icon.ts';
	import type { IconName } from '../icons/paths.ts';
	import Icon from '../icons/Icon.svelte';
	import BrandMark from '../defaults/BrandMark.svelte';
	import { formatShortDate } from './dates.ts';
	import RouteMoreMenu from './RouteMoreMenu.svelte';

	let {
		item,
		currency,
		destination,
		installment = null,
		routing,
		showHandle = false,
		sheet,
		ontoggle,
		onOpen
	}: {
		item: RouteItem & { resolvedBrandIcon?: ResolvedBrandIcon | null };
		currency: CurrencyCode;
		destination: (Destination & { brandIcon?: ResolvedBrandIcon | null }) | null;
		installment?: string | null;
		routing: boolean;
		showHandle?: boolean;
		sheet: string;
		ontoggle: SubmitFunction;
		onOpen: (event: MouseEvent) => void;
	} = $props();

	const brandIcon = $derived(item.resolvedBrandIcon ?? null);
	const categoryIcon = $derived(getRecurringIcon(item.name, destination?.kind, item.icon));
	const amount = $derived(
		item.decision === 'PENDING' || item.decision === 'SKIPPED'
			? hasKnownAmount(item)
				? item.fullAmount
				: null
			: item.chosenAmount
	);
	const metaLabel = $derived.by(() => {
		const parts: string[] = [];
		if (item.dueDate) parts.push(`Due ${formatShortDate(item.dueDate)}`);
		if (installment) parts.push(installment);
		if (item.isDone) parts.push('Paid');
		return parts.join(' · ');
	});
	const pillColor = $derived(destination?.brandIcon?.color ?? null);
	const showMore = $derived(routing && !item.isDone);
</script>

<div class="top">
	{#if showHandle}
		<div class="grip" use:dragHandle aria-hidden="true" tabindex="-1">
			<Icon name="grip" size={16} />
		</div>
	{/if}
	<a
		class="identity"
		href={sheetHref(sheet)}
		onclick={onOpen}
		data-sveltekit-noscroll
		aria-label={`Edit ${item.name}`}
	>
		<span class="glyph" class:brand={Boolean(brandIcon)} aria-hidden="true">
			{#if brandIcon}
				<BrandMark {brandIcon} size={14} />
			{:else}
				<Icon name={categoryIcon as IconName} size={16} />
			{/if}
		</span>
		<span class="text">
			<span class="name">{item.name}</span>
			{#if metaLabel}<span class="meta">{metaLabel}</span>{/if}
		</span>
	</a>
	{#if routing}
		<div class="actions">
			<form method="POST" action="?/toggle" use:enhance={ontoggle}>
				<input type="hidden" name="itemId" value={item.id} />
				<button
					class="check"
					type="submit"
					aria-pressed={item.isDone}
					aria-label={item.isDone
						? `Mark ${item.name} not routed`
						: isRoutedDecision(item.decision)
							? `Mark ${item.name} routed`
							: `Pay full and Mark ${item.name} routed`}
					onpointerdown={(event) => event.stopPropagation()}
					onclick={(event) => event.stopPropagation()}
				>
					{#if item.isDone}<Icon name="check" size={14} stroke={2.6} />{/if}
				</button>
			</form>
			{#if showMore}
				<RouteMoreMenu {item} />
			{/if}
		</div>
	{/if}
</div>

<a
	class="body"
	href={sheetHref(sheet)}
	onclick={onOpen}
	data-sveltekit-noscroll
	aria-label={`Open ${item.name}`}
>
	<div class="divider" aria-hidden="true"></div>
	<div class="bottom">
		{#if destination}
			<span
				class="pill"
				style:color={pillColor ?? undefined}
				style:background={pillColor
					? `color-mix(in srgb, ${pillColor} 14%, transparent)`
					: undefined}
			>
				<span class="arrow" aria-hidden="true">→</span>
				<span class="dest">{destination.name}</span>
			</span>
		{:else}
			<span class="pill muted">
				<span class="arrow" aria-hidden="true">→</span>
				<span class="dest">No destination</span>
			</span>
		{/if}
		{#if amount !== null}
			<span class="amount tabular">{formatMoney(amount, currency)}</span>
		{:else}
			<span class="amount missing">Set amount</span>
		{/if}
	</div>
</a>

<style>
	.top {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
	}
	.grip {
		display: grid;
		place-items: center;
		width: 1.5rem;
		height: 1.75rem;
		flex-shrink: 0;
		color: var(--text-dim);
		cursor: grab;
		touch-action: none;
		user-select: none;
	}
	.grip:active {
		cursor: grabbing;
	}
	.identity {
		display: flex;
		align-items: flex-start;
		gap: 0.625rem;
		min-width: 0;
		flex: 1;
		color: inherit;
		text-decoration: none;
	}
	.glyph {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		flex-shrink: 0;
		border-radius: 0.5rem;
		background: rgb(229 201 139 / 0.1);
		color: var(--accent);
		overflow: hidden;
	}
	.glyph.brand {
		background: rgb(255 255 255 / 0.055);
		border: 1px solid rgb(255 255 255 / 0.06);
	}
	.text {
		min-width: 0;
		display: grid;
		gap: 0.125rem;
	}
	.name {
		font-size: 0.9375rem;
		font-weight: 650;
		color: #f3efe6;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.meta {
		color: var(--text-muted);
		font-size: 0.75rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.actions {
		display: flex;
		align-items: center;
		align-self: flex-start;
		gap: 0.375rem;
		flex-shrink: 0;
		height: 1.75rem;
	}
	.actions form {
		margin: 0;
	}
	.check {
		position: relative;
		display: grid;
		place-items: center;
		width: 1.5rem;
		height: 1.5rem;
		padding: 0;
		border: 0;
		background: transparent;
		color: var(--accent-ink);
	}
	.check::before {
		content: '';
		position: absolute;
		width: 1.125rem;
		height: 1.125rem;
		border-radius: 0.3125rem;
		border: 2px solid var(--border-strong);
	}
	:global(.paid) .check::before {
		border-color: var(--accent);
		background: var(--accent);
	}
	.check :global(svg) {
		position: relative;
	}
	.body {
		display: flex;
		flex-direction: column;
		color: inherit;
		text-decoration: none;
		margin-top: auto;
	}
	.divider {
		margin: 0.625rem 0;
		border-top: 1px solid rgb(255 255 255 / 0.05);
	}
	.bottom {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}
	.pill {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		max-width: 65%;
		min-width: 0;
		padding: 0.25rem 0.625rem;
		border-radius: 9999px;
		background: rgb(229 201 139 / 0.1);
		color: rgb(229 201 139 / 0.9);
		font-size: 0.75rem;
		font-weight: 600;
	}
	.pill.muted {
		background: rgb(255 255 255 / 0.05);
		color: var(--text-muted);
	}
	.arrow {
		flex-shrink: 0;
	}
	.dest {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.amount {
		flex-shrink: 0;
		font-size: 0.9375rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}
	.amount.missing {
		color: var(--accent);
		font-weight: 600;
	}
</style>
