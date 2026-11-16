<script lang="ts">
	import type { ResolvedBrandIcon } from '../../domain/brand-icon.ts';
	import {
		catalogIconLabel,
		filterCatalogIcons,
		type CatalogIcon
	} from '../../domain/recurring-catalog.ts';
	import { getRecurringIcon } from '../../domain/recurring-icon.ts';
	import { encodeBrandIcon } from '../../domain/template-icon.ts';
	import type { IconName } from '../icons/paths.ts';
	import Icon from '../icons/Icon.svelte';
	import BrandMark from './BrandMark.svelte';

	type BrandHit = { key: string; name: string; brandIcon: ResolvedBrandIcon };

	let {
		title,
		value,
		isAuto,
		autoBrand,
		autoBrandName,
		onSelectAuto,
		onSelectCategory,
		onSelectBrand
	}: {
		title: string;
		value: string | null;
		isAuto: boolean;
		autoBrand: ResolvedBrandIcon | null;
		autoBrandName: string | null;
		onSelectAuto: () => void;
		onSelectCategory: (icon: CatalogIcon) => void;
		onSelectBrand: (hit: BrandHit) => void;
	} = $props();

	let search = $state('');
	let brands = $state<BrandHit[]>([]);
	let containerEl: HTMLDivElement | undefined = $state();
	let containerWidth = $state(320);
	let mobile = $state(false);

	const autoIcon = $derived(getRecurringIcon(title));
	const autoLabel = $derived(autoBrandName ?? catalogIconLabel(autoIcon));
	const categories = $derived(filterCatalogIcons(search));
	const cols = $derived(Math.max(5, Math.floor((containerWidth + 8) / (44 + 8))));
	const tile = $derived((containerWidth - (cols - 1) * 8) / cols);

	$effect(() => {
		if (typeof window === 'undefined') return;
		const mq = window.matchMedia('(max-width: 640px)');
		const sync = () => {
			mobile = mq.matches;
		};
		sync();
		mq.addEventListener('change', sync);
		return () => mq.removeEventListener('change', sync);
	});

	$effect(() => {
		const el = containerEl;
		if (!el || typeof ResizeObserver === 'undefined') return;
		const ro = new ResizeObserver((entries) => {
			const width = entries[0]?.contentRect.width;
			if (width) containerWidth = width;
		});
		ro.observe(el);
		return () => ro.disconnect();
	});

	$effect(() => {
		const q = search.trim();
		if (!q) {
			brands = [];
			return;
		}
		const handle = setTimeout(() => {
			void fetch(`/api/icon-search?q=${encodeURIComponent(q)}&limit=24`)
				.then((res) => res.json())
				.then((data: { results?: BrandHit[] }) => {
					brands = data.results ?? [];
				})
				.catch(() => {
					brands = [];
				});
		}, 120);
		return () => clearTimeout(handle);
	});
</script>

<div class="panel">
	<div class="head">
		<span class="label">Icon</span>
		<button
			type="button"
			class="auto"
			class:active={isAuto}
			onclick={onSelectAuto}
			aria-pressed={isAuto}
		>
			<span class="auto-glyph" aria-hidden="true">
				{#if isAuto && autoBrand}
					<BrandMark brandIcon={autoBrand} size={12} />
				{:else}
					<Icon name={autoIcon as IconName} size={14} />
				{/if}
			</span>
			Auto ({autoLabel})
		</button>
	</div>

	<label class="search">
		<span class="search-icon" aria-hidden="true"><Icon name="search" size={14} /></span>
		<input
			class="search-input"
			type="search"
			placeholder="Search icons or banks..."
			bind:value={search}
			autocomplete="off"
		/>
		{#if search}
			<button type="button" class="clear" aria-label="Clear search" onclick={() => (search = '')}
				>×</button
			>
		{/if}
	</label>

	<div
		class="grid-wrap"
		class:mobile
		bind:this={containerEl}
		style:--cols={cols}
		style:--tile-size="{tile}px"
	>
		<div class="grid" role="listbox" aria-label="Icons">
			{#each categories as icon (icon.key)}
				<button
					type="button"
					class="tile"
					class:selected={!isAuto && value === icon.key}
					role="option"
					aria-selected={!isAuto && value === icon.key}
					aria-label={icon.label}
					title={icon.label}
					onclick={() => onSelectCategory(icon)}
				>
					<Icon name={icon.key as IconName} size={18} />
				</button>
			{/each}
			{#each brands as hit (hit.key)}
				<button
					type="button"
					class="tile brand"
					class:selected={!isAuto && value === encodeBrandIcon(hit.key)}
					role="option"
					aria-selected={!isAuto && value === encodeBrandIcon(hit.key)}
					aria-label={hit.name}
					title={hit.name}
					onclick={() => onSelectBrand(hit)}
				>
					<BrandMark brandIcon={hit.brandIcon} size={16} />
				</button>
			{/each}
		</div>
	</div>
</div>

<style>
	.panel {
		display: grid;
		gap: 0.5rem;
	}
	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}
	.label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--text-muted);
	}
	.auto {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		border-radius: 9999px;
		padding: 0.25rem 0.625rem;
		font-size: 0.75rem;
		border: 1px solid var(--border);
		background: rgb(255 255 255 / 0.04);
		color: var(--text-muted);
		cursor: pointer;
	}
	.auto.active {
		border-color: rgb(229 201 139 / 0.45);
		background: rgb(229 201 139 / 0.12);
		color: var(--accent);
	}
	.auto-glyph {
		display: inline-flex;
	}
	.search {
		position: relative;
		display: flex;
		align-items: center;
	}
	.search-icon {
		position: absolute;
		left: 0.7rem;
		color: var(--text-muted);
		pointer-events: none;
	}
	.search-input {
		width: 100%;
		height: 2.25rem;
		padding: 0 2rem 0 2.1rem;
		border-radius: 0.625rem;
		border: 1px solid var(--border);
		background: rgb(255 255 255 / 0.03);
		color: var(--text);
		font: inherit;
	}
	.clear {
		position: absolute;
		right: 0.4rem;
		border: 0;
		background: transparent;
		color: var(--text-muted);
		cursor: pointer;
		font-size: 1.1rem;
		line-height: 1;
		padding: 0.25rem 0.4rem;
	}
	.grid-wrap {
		max-height: calc(2 * var(--tile-size) + 0.5rem);
		overflow-x: hidden;
		overflow-y: auto;
		overscroll-behavior: contain;
		scrollbar-width: thin;
		scrollbar-color: rgb(255 255 255 / 0.16) transparent;
	}
	.grid-wrap.mobile {
		max-height: none;
		overflow-x: auto;
		overflow-y: hidden;
		scroll-snap-type: x mandatory;
		scrollbar-width: none;
	}
	.grid-wrap.mobile::-webkit-scrollbar {
		display: none;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
		gap: 0.5rem;
	}
	.grid-wrap.mobile .grid {
		grid-auto-flow: column;
		grid-auto-columns: var(--tile-size);
		grid-template-columns: none;
		width: max-content;
	}
	.tile {
		box-sizing: border-box;
		width: 100%;
		aspect-ratio: 1 / 1;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.625rem;
		border: 1px solid rgb(255 255 255 / 0.06);
		background: rgb(255 255 255 / 0.04);
		color: var(--text);
		cursor: pointer;
		padding: 0;
		scroll-snap-align: start;
	}
	.grid-wrap.mobile .tile {
		width: var(--tile-size);
		height: var(--tile-size);
	}
	.tile.selected {
		border-color: var(--accent);
		background: rgb(229 201 139 / 0.16);
		color: var(--accent);
	}
	.tile.brand {
		overflow: hidden;
		padding: 0.2rem;
	}
</style>
