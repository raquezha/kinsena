<script lang="ts">
	import type { ResolvedBrandIcon } from '../../domain/brand-icon.ts';
	import BrandMark from './BrandMark.svelte';

	let { name = '' }: { name?: string } = $props();

	let brandIcon = $state<ResolvedBrandIcon | null>(null);

	$effect(() => {
		const q = name.trim();
		if (!q) {
			brandIcon = null;
			return;
		}
		const handle = setTimeout(() => {
			void fetch(`/api/brand-icon?name=${encodeURIComponent(q)}`)
				.then((res) => res.json())
				.then((data: { brandIcon?: ResolvedBrandIcon | null }) => {
					brandIcon = data.brandIcon ?? null;
				})
				.catch(() => {
					brandIcon = null;
				});
		}, 150);
		return () => clearTimeout(handle);
	});
</script>

<span
	class="badge"
	class:empty={!brandIcon}
	aria-live="polite"
	title={brandIcon ? 'Brand badge preview' : 'Type a bank or biller name to preview'}
>
	{#if brandIcon}
		<BrandMark {brandIcon} size={18} />
	{:else}
		<span class="hint">Auto</span>
	{/if}
</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.375rem;
		height: 2.375rem;
		flex-shrink: 0;
		border-radius: 0.625rem;
		background: rgb(255 255 255 / 0.055);
		border: 1px solid rgb(255 255 255 / 0.08);
		overflow: hidden;
	}

	.badge.empty {
		color: var(--text-muted);
	}

	.hint {
		font-size: 0.625rem;
		font-weight: 700;
		letter-spacing: 0.02em;
		text-transform: uppercase;
	}
</style>
