<script lang="ts">
	import type { ResolvedBrandIcon } from '../../domain/brand-icon.ts';
	import type { CurrencyCode } from '../../domain/currency.ts';
	import { allocationProgress, destinationChips } from '../../domain/history-archive.ts';
	import type { Destination } from '../../domain/models.ts';
	import { formatMoney } from '../../domain/money.ts';
	import type { PaydayView } from '../../domain/summary.ts';
	import { formatCycleDate } from '../checklist/dates.ts';

	let {
		view,
		currency,
		destinations,
		selected = false,
		latest = false,
		onclick
	}: {
		view: PaydayView;
		currency: CurrencyCode;
		destinations: (Destination & { brandIcon?: ResolvedBrandIcon | null })[];
		selected?: boolean;
		latest?: boolean;
		onclick: () => void;
	} = $props();

	const { payday, summary } = $derived(view);
	const progress = $derived(allocationProgress(summary));
	const preview = $derived(destinationChips(view.items, destinations, 2));
	const kept = $derived(summary.leftToRoute);
</script>

<article class="archive-card" class:selected>
	<button
		class="hit"
		type="button"
		aria-pressed={selected}
		aria-label={`Open statement for ${payday.title}`}
		{onclick}
	>
		<header class="head">
			<div class="titles">
				<span class="title">{payday.title}</span>
				<span class="date">{formatCycleDate(payday.scheduledDate)}</span>
			</div>
			{#if latest}<span class="latest">Latest</span>{/if}
		</header>

		<div class="hero">
			<span class="kept-label">Kept</span>
			<span class="kept tabular">
				{kept === null ? '—' : formatMoney(kept, currency)}
			</span>
		</div>

		<div
			class="track"
			role="progressbar"
			aria-label="Allocation progress"
			aria-valuemin={0}
			aria-valuemax={100}
			aria-valuenow={Math.round(progress * 100)}
		>
			<span class="fill" style:width={`${progress * 100}%`}></span>
		</div>

		<div class="chips">
			{#each preview.chips as chip (chip.name)}
				<span
					class="chip"
					style:color={chip.color ?? undefined}
					style:background={chip.color
						? `color-mix(in srgb, ${chip.color} 14%, transparent)`
						: undefined}
				>
					<span class="arrow" aria-hidden="true">→</span>
					<span class="chip-name">{chip.name}</span>
					<span class="chip-amt tabular">{formatMoney(chip.amount, currency)}</span>
				</span>
			{/each}
			{#if preview.moreCount > 0}
				<span class="more">+{preview.moreCount} more</span>
			{/if}
		</div>

		<footer class="foot">
			<span>{summary.doneCount} of {summary.itemCount} routed</span>
			<span class="salary">
				Salary {summary.salary === null ? '—' : formatMoney(summary.salary, currency)}
			</span>
		</footer>
	</button>
</article>

<style>
	.archive-card {
		position: relative;
		min-height: 11rem;
		border-radius: 0.875rem;
		background: linear-gradient(145deg, rgb(32 30 26 / 0.85) 0%, rgb(22 21 18 / 0.95) 100%);
		border: 1px solid rgb(255 255 255 / 0.08);
		box-shadow: 0 8px 24px rgb(0 0 0 / 0.35);
		transition:
			border-color 160ms ease,
			box-shadow 160ms ease;
	}

	.archive-card.selected {
		border-color: rgb(229 201 139 / 0.5);
		box-shadow:
			0 12px 28px rgb(0 0 0 / 0.5),
			0 0 0 1px rgb(229 201 139 / 0.25);
	}

	.hit {
		width: 100%;
		min-height: 11rem;
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 0.75rem;
		border: 0;
		background: transparent;
		color: inherit;
		text-align: left;
		cursor: pointer;
	}

	.head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.titles {
		display: grid;
		gap: 0.15rem;
		min-width: 0;
	}

	.title {
		font-size: 1.05rem;
		font-weight: 700;
		color: #f3efe6;
	}

	.date {
		color: rgb(255 255 255 / 0.5);
		font-size: 0.75rem;
	}

	.latest {
		flex-shrink: 0;
		padding: 0.2rem 0.55rem;
		border-radius: 9999px;
		background: rgb(229 201 139 / 0.16);
		border: 1px solid rgb(229 201 139 / 0.35);
		color: var(--accent);
		font-size: 0.6875rem;
		font-weight: 700;
		letter-spacing: 0.02em;
		text-transform: uppercase;
	}

	.hero {
		display: grid;
		gap: 0.15rem;
	}

	.kept-label {
		color: rgb(255 255 255 / 0.45);
		font-size: 0.75rem;
		font-weight: 600;
	}

	.kept {
		font-size: 1.65rem;
		font-weight: 800;
		letter-spacing: -0.02em;
		color: var(--accent);
		font-variant-numeric: tabular-nums;
	}

	.track {
		height: 0.375rem;
		border-radius: 9999px;
		background: rgb(255 255 255 / 0.06);
		overflow: hidden;
	}

	.fill {
		display: block;
		height: 100%;
		border-radius: inherit;
		background: linear-gradient(90deg, rgb(229 201 139 / 0.75), var(--accent));
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4rem;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		max-width: 100%;
		min-width: 0;
		padding: 0.25rem 0.55rem;
		border-radius: 9999px;
		background: rgb(229 201 139 / 0.1);
		color: rgb(229 201 139 / 0.9);
		font-size: 0.75rem;
		font-weight: 600;
	}

	.arrow {
		flex-shrink: 0;
	}

	.chip-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.chip-amt {
		flex-shrink: 0;
		color: #f3efe6;
		font-variant-numeric: tabular-nums;
	}

	.more {
		color: rgb(255 255 255 / 0.45);
		font-size: 0.75rem;
		font-weight: 600;
	}

	.foot {
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
		color: rgb(255 255 255 / 0.5);
		font-size: 0.75rem;
	}

	.salary {
		color: rgb(255 255 255 / 0.72);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
</style>
