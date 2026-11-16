<script lang="ts">
	import type { ResolvedBrandIcon } from '../../domain/brand-icon.ts';

	let {
		brandIcon,
		size = 16
	}: {
		brandIcon: ResolvedBrandIcon;
		size?: number;
	} = $props();
</script>

{#if brandIcon.kind === 'svg'}
	<svg
		viewBox="0 0 24 24"
		width={size}
		height={size}
		fill="currentColor"
		style:color={brandIcon.color}
		aria-hidden="true"
	>
		<path d={brandIcon.path} />
	</svg>
{:else}
	<span
		class="mono"
		style:color={brandIcon.color}
		data-len={String(brandIcon.label.length)}
		aria-hidden="true">{brandIcon.label}</span
	>
{/if}

<style>
	.mono {
		display: block;
		max-width: 100%;
		overflow: hidden;
		text-overflow: clip;
		white-space: nowrap;
		font-size: 0.6875rem;
		font-weight: 800;
		letter-spacing: -0.03em;
		line-height: 1;
		text-align: center;
		text-transform: uppercase;
	}

	.mono[data-len='4'] {
		font-size: 0.5625rem;
	}

	.mono[data-len='5'],
	.mono[data-len='6'] {
		font-size: 0.5rem;
	}
</style>
