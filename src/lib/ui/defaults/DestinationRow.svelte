<script lang="ts">
	import { openSheet, sheetHref } from '../../client/sheet-route.ts';
	import { DESTINATION_KIND_LABELS, formatTemplateUsageLabel } from '../../domain/destination.ts';
	import type { ResolvedBrandIcon } from '../../domain/brand-icon.ts';
	import type { Destination } from '../../domain/models.ts';
	import Icon from '../icons/Icon.svelte';

	let {
		destination,
		usageCount = 0,
		brandIcon = null
	}: {
		destination: Destination;
		usageCount?: number;
		brandIcon?: ResolvedBrandIcon | null;
	} = $props();

	const sheet = $derived(`place-${destination.id}`);
	const isAccount = $derived(destination.kind === 'ACCOUNT');
	const fallbackIcon = $derived(isAccount ? 'landmark' : 'receipt');
	const meta = $derived(
		`${DESTINATION_KIND_LABELS[destination.kind]} · ${formatTemplateUsageLabel(usageCount)}`
	);
</script>

<a
	class="row"
	href={sheetHref(sheet)}
	data-sveltekit-noscroll
	onclick={(event) => {
		event.preventDefault();
		void openSheet(sheet);
	}}
>
	<span class="leading">
		<span class="badge" class:fallback={!brandIcon} class:account={isAccount} aria-hidden="true">
			{#if brandIcon?.kind === 'svg'}
				<svg
					viewBox="0 0 24 24"
					width="20"
					height="20"
					fill="currentColor"
					style:color={brandIcon.color}
				>
					<path d={brandIcon.path} />
				</svg>
			{:else if brandIcon?.kind === 'monogram'}
				<span
					class="brand-monogram"
					style:color={brandIcon.color}
					data-len={String(brandIcon.label.length)}>{brandIcon.label}</span
				>
			{:else}
				<Icon name={fallbackIcon} size={18} />
			{/if}
		</span>
		<span class="titles">
			<span class="name">{destination.name}</span>
			<span class="meta">{meta}</span>
		</span>
	</span>
	<span class="chevron" aria-hidden="true"><Icon name="chevron" size={18} /></span>
</a>

<style>
	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.875rem 1rem;
		border-radius: var(--radius-md);
		border: 1px solid var(--border-subtle);
		background: var(--surface);
		color: inherit;
		text-decoration: none;
		transition: border-color var(--duration-fast) var(--ease-out);
	}

	.row:hover {
		border-color: var(--border);
	}

	.leading {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-width: 0;
		flex: 1;
	}

	.badge {
		display: flex;
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

	.badge.fallback.account {
		color: var(--accent);
	}

	.badge.fallback:not(.account) {
		color: var(--text-muted);
	}

	.brand-monogram {
		display: block;
		max-width: 100%;
		padding: 0 0.12rem;
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

	.brand-monogram[data-len='4'] {
		font-size: 0.5625rem;
	}

	.brand-monogram[data-len='5'],
	.brand-monogram[data-len='6'] {
		font-size: 0.5rem;
	}

	.titles {
		min-width: 0;
		display: grid;
	}

	.name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--text);
	}

	.meta {
		margin-top: 0.125rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.chevron {
		flex-shrink: 0;
		color: var(--text-muted);
	}
</style>
