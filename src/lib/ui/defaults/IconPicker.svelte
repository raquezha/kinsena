<script lang="ts">
	import type { ResolvedBrandIcon } from '../../domain/brand-icon.ts';
	import type { CatalogIcon } from '../../domain/recurring-catalog.ts';
	import { getRecurringIcon } from '../../domain/recurring-icon.ts';
	import { brandKeyFromIcon, encodeBrandIcon } from '../../domain/template-icon.ts';
	import type { IconName } from '../icons/paths.ts';
	import Icon from '../icons/Icon.svelte';
	import BrandMark from './BrandMark.svelte';
	import IconPickerPanel from './IconPickerPanel.svelte';

	type BrandHit = { key: string; name: string; brandIcon: ResolvedBrandIcon };

	let {
		title = $bindable(''),
		value = $bindable(null as string | null),
		iconName = 'icon',
		fieldName = 'name'
	}: {
		title?: string;
		value?: string | null;
		iconName?: string;
		fieldName?: string;
	} = $props();

	let pickerOpen = $state(false);
	let autoBrand = $state<ResolvedBrandIcon | null>(null);
	let autoBrandName = $state<string | null>(null);
	let lockedBrand = $state<ResolvedBrandIcon | null>(null);

	const isAuto = $derived(value === null || value === '');
	const triggerBrand = $derived(isAuto ? autoBrand : lockedBrand);
	const triggerIcon = $derived(getRecurringIcon(title, null, isAuto ? null : value));

	// Live brand match while Auto — typing "BDO" fills the trigger; clearing reverts.
	$effect(() => {
		if (!isAuto) return;
		const q = title.trim();
		if (!q) {
			autoBrand = null;
			autoBrandName = null;
			return;
		}
		const handle = setTimeout(() => {
			void fetch(`/api/brand-icon?name=${encodeURIComponent(q)}`)
				.then((res) => res.json())
				.then((data: { brandIcon?: ResolvedBrandIcon | null; name?: string | null }) => {
					autoBrand = data.brandIcon ?? null;
					autoBrandName = data.name ?? null;
				})
				.catch(() => {
					autoBrand = null;
					autoBrandName = null;
				});
		}, 120);
		return () => clearTimeout(handle);
	});

	// Hydrate locked brand mark when editing an existing brand: override.
	$effect(() => {
		const key = value ? brandKeyFromIcon(value) : null;
		if (!key) {
			if (isAuto) lockedBrand = null;
			return;
		}
		const handle = setTimeout(() => {
			void fetch(`/api/brand-icon?name=${encodeURIComponent(key)}`)
				.then((res) => res.json())
				.then((data: { brandIcon?: ResolvedBrandIcon | null }) => {
					lockedBrand = data.brandIcon ?? null;
				})
				.catch(() => {
					lockedBrand = null;
				});
		}, 0);
		return () => clearTimeout(handle);
	});

	function selectCategory(icon: CatalogIcon) {
		value = icon.key;
		lockedBrand = null;
		pickerOpen = false;
	}

	function selectBrand(hit: BrandHit) {
		value = encodeBrandIcon(hit.key);
		lockedBrand = hit.brandIcon;
		pickerOpen = false;
	}

	function selectAuto() {
		value = null;
		lockedBrand = null;
	}
</script>

<div class="picker">
	<input type="hidden" name={iconName} value={isAuto ? '' : (value ?? '')} />
	<div class="field">
		<span class="field-label" id="template-name-label">Name</span>
		<div class="name-row">
			<button
				type="button"
				class="trigger"
				class:open={pickerOpen}
				aria-expanded={pickerOpen}
				aria-label="Choose icon"
				title="Choose icon"
				onclick={() => (pickerOpen = !pickerOpen)}
			>
				<span class="glyph" aria-hidden="true">
					{#if triggerBrand}
						<BrandMark brandIcon={triggerBrand} size={16} />
					{:else}
						<Icon name={triggerIcon as IconName} size={18} />
					{/if}
				</span>
				<span class="chev" aria-hidden="true">{pickerOpen ? '▴' : '▾'}</span>
			</button>
			<input
				class="input"
				name={fieldName}
				required
				maxlength="128"
				autocomplete="off"
				aria-labelledby="template-name-label"
				bind:value={title}
			/>
		</div>
	</div>

	{#if pickerOpen}
		<IconPickerPanel
			{title}
			{value}
			{isAuto}
			{autoBrand}
			{autoBrandName}
			onSelectAuto={selectAuto}
			onSelectCategory={selectCategory}
			onSelectBrand={selectBrand}
		/>
	{/if}
</div>

<style>
	.picker {
		display: grid;
		gap: 0.5rem;
	}

	.field-label {
		display: block;
		margin-bottom: 0.35rem;
	}

	.name-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.trigger {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.75rem;
		height: 2.75rem;
		flex-shrink: 0;
		border-radius: 0.75rem;
		border: 1px solid rgb(255 255 255 / 0.08);
		background: rgb(255 255 255 / 0.055);
		color: var(--accent);
		cursor: pointer;
		padding: 0;
	}

	.trigger.open {
		border-color: rgb(229 201 139 / 0.45);
	}

	.glyph {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
		overflow: hidden;
	}

	.chev {
		position: absolute;
		right: 0.2rem;
		bottom: 0.1rem;
		font-size: 0.5rem;
		line-height: 1;
		color: var(--text-muted);
	}

	.name-row .input {
		flex: 1;
		min-width: 0;
	}
</style>
